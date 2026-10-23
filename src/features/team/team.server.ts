import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "@tanstack/react-router";

import type { ProgramRole } from "#/features/programs/programs.server";
import { buildInvitationEmail } from "#/features/team/invitation-email";
import { getAppOrigin } from "#/lib/app-origin";
import type { EmailConfig } from "#/lib/config.server";
import { sendEmail } from "#/lib/email/resend.server";
import { consumeRateLimit } from "#/lib/rate-limit.server";
import type { Database } from "#/lib/supabase/database.types";
import { databaseError } from "#/lib/supabase/errors.server";

type Supabase = SupabaseClient<Database>;

export type TeamAction = "invite" | "accept-invitation" | "view-invitation";

/** Each invitation may send an email: a few per minute and per IP. */
export async function enforceTeamRateLimit(action: TeamAction): Promise<void> {
	if (!(await consumeRateLimit("TEAM_RATE_LIMITER", action))) {
		throw new Error("Too many attempts. Wait a minute and try again.");
	}
}

/**
 * The signed-in user's role in the program's team, read with their client
 * (RLS). A program outside their teams behaves like a missing one.
 */
export async function getTeamRole(
	supabase: Supabase,
	programId: string,
	userId: string,
): Promise<ProgramRole> {
	const { data, error } = await supabase
		.from("program_members")
		.select("role")
		.eq("program_id", programId)
		.eq("user_id", userId)
		.maybeSingle();
	if (error) {
		throw databaseError("load the team", error);
	}
	if (!data) {
		throw notFound();
	}
	return data.role;
}

export async function requireProgramAdmin(
	supabase: Supabase,
	programId: string,
	userId: string,
): Promise<void> {
	if ((await getTeamRole(supabase, programId, userId)) !== "admin") {
		throw new Error("Only the program's admins can do this.");
	}
}

export interface TeamMemberView {
	userId: string;
	email: string;
	role: ProgramRole;
	joinedAt: string;
}

export interface InvitationView {
	id: string;
	email: string;
	createdAt: string;
	expiresAt: string;
}

/** In-app path of an invitation link. Only the invitation email carries it. */
export function invitationPath(token: string): string {
	return `/invite/${token}`;
}

/**
 * Emails the invitation link: the only place it ever goes. Returns whether
 * the email went out; inviting again renews the link and retries.
 */
export async function sendInvitationEmail(
	config: EmailConfig,
	invitation: {
		id: string;
		email: string;
		token: string;
		expiresAt: string;
		programName: string;
		inviterEmail: string;
	},
): Promise<boolean> {
	try {
		const email = buildInvitationEmail({
			programName: invitation.programName,
			inviterEmail: invitation.inviterEmail,
			link: `${getAppOrigin()}${invitationPath(invitation.token)}`,
		});
		await sendEmail(config, {
			to: invitation.email,
			...email,
			// Inviting again renews the expiry: a new key, so a new email.
			idempotencyKey: `program-invitation/${invitation.id}/${invitation.expiresAt}`,
		});
		return true;
	} catch (error) {
		console.error("Invitation email failed", invitation.id, error);
		return false;
	}
}
