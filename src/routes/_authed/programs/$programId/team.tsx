import {
	createFileRoute,
	notFound,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { InvitationList } from "#/features/team/components/invitation-list";
import { InviteForm } from "#/features/team/components/invite-form";
import { TeamMemberList } from "#/features/team/components/team-member-list";
import {
	cancelInvitation,
	getTeam,
	inviteTeamMember,
	removeTeamMember,
} from "#/features/team/team.functions";
import { FormAlert } from "@/components/form-alert";

export const Route = createFileRoute("/_authed/programs/$programId/team")({
	loader: ({ params }) => {
		if (!z.uuid().safeParse(params.programId).success) {
			throw notFound();
		}
		return getTeam({ data: { programId: params.programId } });
	},
	component: TeamPage,
});

interface InviteResult {
	email: string;
	sent: boolean;
}

function TeamPage() {
	const { programId } = Route.useParams();
	const team = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate();
	const inviteFn = useServerFn(inviteTeamMember);
	const cancelFn = useServerFn(cancelInvitation);
	const removeFn = useServerFn(removeTeamMember);
	const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
	const isAdmin = team.role === "admin";

	async function invite(email: string) {
		setInviteResult(null);
		const result = await inviteFn({ data: { programId, email } });
		await router.invalidate({ sync: true });
		setInviteResult({ email, sent: result.sent });
	}

	return (
		<div className="flex flex-col gap-10">
			{isAdmin ? (
				<section className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<h2 className="font-semibold text-lg">Invite someone</h2>
						<p className="text-muted-foreground text-sm">
							They get an email with a link that signs them in, no password
							needed. Team members issue cards, add points, scan cards and
							message customers. Only admins change the program and manage the
							team.
						</p>
					</div>
					{team.emailsEnabled ? (
						<>
							{inviteResult ? <InviteNotice result={inviteResult} /> : null}
							<InviteForm onInvite={invite} />
						</>
					) : (
						<FormAlert>
							Invitations are sent by email, which is not set up on this Loylo
							installation (RESEND_API_KEY and EMAIL_FROM).
						</FormAlert>
					)}
				</section>
			) : null}

			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-lg">Team</h2>
				<TeamMemberList
					members={team.members}
					userId={team.userId}
					isAdmin={isAdmin}
					onRemove={async (member) => {
						await removeFn({ data: { programId, userId: member.userId } });
						if (member.userId === team.userId) {
							// This program's pages are no longer reachable: leave first.
							await navigate({ to: "/dashboard" });
							await router.invalidate();
						} else {
							await router.invalidate({ sync: true });
						}
					}}
				/>
			</section>

			{isAdmin && team.invitations.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h2 className="font-semibold text-lg">Pending invitations</h2>
					<InvitationList
						invitations={team.invitations}
						emailsEnabled={team.emailsEnabled}
						onResend={(invitation) => invite(invitation.email)}
						onCancel={async (invitation) => {
							await cancelFn({
								data: { programId, invitationId: invitation.id },
							});
							setInviteResult(null);
							await router.invalidate({ sync: true });
						}}
					/>
				</section>
			) : null}
		</div>
	);
}

/** The invitation is saved; says whether its email went out. */
function InviteNotice({ result }: { result: InviteResult }) {
	return result.sent ? (
		<FormAlert tone="success">
			Invitation sent to {result.email}. The link in the email expires in 7
			days.
		</FormAlert>
	) : (
		<FormAlert>
			The invitation for {result.email} is saved, but the email could not be
			sent. Send it again in a moment.
		</FormAlert>
	);
}
