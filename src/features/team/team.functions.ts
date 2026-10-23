import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "#/features/auth/auth.middleware";
import { signInWithVerifiedEmail } from "#/features/auth/auth.server";
import { programIdSchema } from "#/features/programs/programs.schemas";
import {
	invitationIdSchema,
	invitationTokenSchema,
	inviteTeamMemberSchema,
	teamMemberIdSchema,
} from "#/features/team/team.schemas";
import {
	enforceTeamRateLimit,
	getTeamRole,
	type InvitationView,
	requireProgramAdmin,
	sendInvitationEmail,
	type TeamMemberView,
} from "#/features/team/team.server";
import { getOptionalEmailConfig } from "#/lib/config.server";
import { createAdminClient } from "#/lib/supabase/admin-client.server";
import { databaseError } from "#/lib/supabase/errors.server";

/**
 * A program's team: its admins invite people by email, and the link in that
 * email signs the invitee in and adds them to the team. The link only exists
 * in the email (the database keeps its hash), so opening it proves access to
 * the invited mailbox. Team emails live in `auth.users`, so the database
 * functions that read them are server only: these functions check the
 * caller's role with their own client (RLS) first, then call them with the
 * admin client.
 */

export const getTeam = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		const role = await getTeamRole(
			context.supabase,
			data.programId,
			context.userId,
		);

		const { data: rows, error } = await createAdminClient().rpc(
			"list_program_team",
			{ program_id: data.programId },
		);
		if (error) {
			throw databaseError("load the team", error);
		}
		const members: TeamMemberView[] = rows.map((row) => ({
			userId: row.user_id,
			email: row.email,
			role: row.role,
			joinedAt: row.joined_at,
		}));

		// RLS shows invitations to admins only.
		let invitations: InvitationView[] = [];
		if (role === "admin") {
			const { data: invitationRows, error: invitationsError } =
				await context.supabase
					.from("program_invitations")
					.select("id, email, created_at, expires_at")
					.eq("program_id", data.programId)
					.gt("expires_at", new Date().toISOString())
					.order("created_at", { ascending: false });
			if (invitationsError) {
				throw databaseError("load the invitations", invitationsError);
			}
			invitations = invitationRows.map((row) => ({
				id: row.id,
				email: row.email,
				createdAt: row.created_at,
				expiresAt: row.expires_at,
			}));
		}

		return {
			role,
			userId: context.userId,
			members,
			invitations,
			emailsEnabled: getOptionalEmailConfig() !== null,
		};
	});

/**
 * Invites someone to the team, or renews their pending invitation (new link,
 * new expiry), then emails them the link. Returns whether the email went out:
 * the invitation is saved either way, and inviting again retries.
 */
export const inviteTeamMember = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(inviteTeamMemberSchema)
	.handler(async ({ data, context }) => {
		const emailConfig = getOptionalEmailConfig();
		if (!emailConfig) {
			throw new Error("Invitations need emails, which are not set up yet.");
		}
		await enforceTeamRateLimit("invite");
		await requireProgramAdmin(context.supabase, data.programId, context.userId);
		if (data.email === context.userEmail.toLowerCase()) {
			throw new Error("You are already in the team.");
		}

		const { data: program, error: programError } = await context.supabase
			.from("programs")
			.select("name")
			.eq("id", data.programId)
			.maybeSingle();
		if (programError) {
			throw databaseError("send the invitation", programError);
		}
		if (!program) {
			throw notFound();
		}

		const { data: invitation, error } = await createAdminClient()
			.rpc("create_program_invitation", {
				program_id: data.programId,
				email: data.email,
				invited_by: context.userId,
			})
			.maybeSingle();
		if (error) {
			if (error.code === "LY003") {
				throw new Error("This person is already in the team.");
			}
			if (error.code === "LY004") {
				throw new Error(
					"Too many pending invitations. Cancel some, or wait until they are accepted.",
				);
			}
			throw databaseError("send the invitation", error);
		}
		if (!invitation) {
			throw notFound();
		}

		return {
			sent: await sendInvitationEmail(emailConfig, {
				id: invitation.invitation_id,
				email: data.email,
				token: invitation.token,
				expiresAt: invitation.expires_at,
				programName: program.name,
				inviterEmail: context.userEmail,
			}),
		};
	});

export const cancelInvitation = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(invitationIdSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.from("program_invitations")
			.delete()
			.eq("id", data.invitationId)
			.eq("program_id", data.programId)
			.select("id")
			.maybeSingle();
		if (error) {
			throw databaseError("cancel the invitation", error);
		}
		if (!row) {
			throw notFound();
		}
	});

/**
 * Removes someone from the team (admins), or leaves it (anyone, with their
 * own ID). The program's owner always stays: RLS refuses it like a missing
 * row. Removed people lose access right away.
 */
export const removeTeamMember = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(teamMemberIdSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.from("program_members")
			.delete()
			.eq("program_id", data.programId)
			.eq("user_id", data.userId)
			.select("user_id")
			.maybeSingle();
		if (error) {
			throw databaseError("update the team", error);
		}
		if (!row) {
			throw new Error(
				data.userId === context.userId
					? "You cannot leave a program you created."
					: "This person cannot be removed from the team.",
			);
		}
	});

/** A pending invitation, by the token of its link (server only). */
async function findInvitation(token: string) {
	const { data, error } = await createAdminClient()
		.rpc("get_program_invitation", { token })
		.maybeSingle();
	if (error) {
		throw databaseError("load the invitation", error);
	}
	if (!data) {
		throw notFound();
	}
	return data;
}

/** What the invitation page shows. Public: the link's token is the secret. */
export const getInvitation = createServerFn({ method: "GET" })
	.validator(invitationTokenSchema)
	.handler(async ({ data }) => {
		await enforceTeamRateLimit("view-invitation");
		const invitation = await findInvitation(data.token);
		return { email: invitation.email, programName: invitation.program_name };
	});

/**
 * Signs the invitee in, without a password (creating their account if
 * needed), then adds them to the team. The token was only sent to the invited
 * email, so it proves access to that mailbox like a magic link. A POST behind
 * a button: email scanners that open links do not use the invitation up.
 */
export const joinTeam = createServerFn({ method: "POST" })
	.validator(invitationTokenSchema)
	.handler(async ({ data }) => {
		await enforceTeamRateLimit("accept-invitation");
		const invitation = await findInvitation(data.token);
		const userId = await signInWithVerifiedEmail(invitation.email);

		const { data: programId, error } = await createAdminClient().rpc(
			"accept_program_invitation",
			{ token: data.token, user_id: userId },
		);
		if (error) {
			if (error.code === "LY005") {
				throw new Error(
					"This invitation is invalid or has expired. Ask for a new one.",
				);
			}
			throw databaseError("join the team", error);
		}
		return { programId };
	});
