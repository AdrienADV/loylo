import { useState } from "react";

import type { InvitationView } from "#/features/team/team.server";
import { FormAlert } from "@/components/form-alert";
import { FormattedDate } from "@/components/formatted-date";
import { Button } from "@/components/ui/button";

/** Pending invitations, for admins: send the email again, cancel. */
export function InvitationList({
	invitations,
	emailsEnabled,
	onResend,
	onCancel,
}: {
	invitations: InvitationView[];
	emailsEnabled: boolean;
	onResend: (invitation: InvitationView) => Promise<void>;
	onCancel: (invitation: InvitationView) => Promise<void>;
}) {
	return (
		<ul className="divide-y overflow-hidden rounded-2xl border">
			{invitations.map((invitation) => (
				<InvitationRow
					key={invitation.id}
					invitation={invitation}
					emailsEnabled={emailsEnabled}
					onResend={() => onResend(invitation)}
					onCancel={() => onCancel(invitation)}
				/>
			))}
		</ul>
	);
}

function InvitationRow({
	invitation,
	emailsEnabled,
	onResend,
	onCancel,
}: {
	invitation: InvitationView;
	emailsEnabled: boolean;
	onResend: () => Promise<void>;
	onCancel: () => Promise<void>;
}) {
	const [pending, setPending] = useState<"resend" | "cancel" | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function run(
		action: "resend" | "cancel",
		handler: () => Promise<void>,
	) {
		setPending(action);
		setError(null);
		try {
			await handler();
		} catch (actionError) {
			setError(
				actionError instanceof Error
					? actionError.message
					: "Something went wrong.",
			);
		} finally {
			setPending(null);
		}
	}

	return (
		<li className="flex flex-col gap-2 px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<span className="truncate font-medium">{invitation.email}</span>
					<span className="text-muted-foreground text-sm">
						Invited <FormattedDate value={invitation.createdAt} /> · Expires{" "}
						<FormattedDate value={invitation.expiresAt} />
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={pending !== null || !emailsEnabled}
						onClick={() => run("resend", onResend)}
					>
						{pending === "resend" ? "Sending…" : "Send again"}
					</Button>
					<Button
						variant="outline"
						disabled={pending !== null}
						onClick={() => run("cancel", onCancel)}
					>
						{pending === "cancel" ? "Canceling…" : "Cancel"}
					</Button>
				</div>
			</div>
			<FormAlert>{error}</FormAlert>
		</li>
	);
}
