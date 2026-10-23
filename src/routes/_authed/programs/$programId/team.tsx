import {
	Await,
	createFileRoute,
	getRouteApi,
	notFound,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { InvitationList } from "#/features/team/components/invitation-list";
import {
	InviteForm,
	InviteFormSkeleton,
} from "#/features/team/components/invite-form";
import {
	TeamMemberList,
	TeamMemberListSkeleton,
} from "#/features/team/components/team-member-list";
import {
	cancelInvitation,
	getTeam,
	inviteTeamMember,
	removeTeamMember,
} from "#/features/team/team.functions";
import { FormAlert } from "@/components/form-alert";
import { toast } from "@/components/ui/toast";

const programRoute = getRouteApi("/_authed/programs/$programId");

export const Route = createFileRoute("/_authed/programs/$programId/team")({
	// Not awaited: the page shows at once, with skeletons until the team comes.
	loader: ({ params }) => {
		if (!z.uuid().safeParse(params.programId).success) {
			throw notFound();
		}
		return {
			team: getTeam({ data: { programId: params.programId } }),
		};
	},
	component: TeamPage,
});

function TeamPage() {
	const program = programRoute.useLoaderData();
	const { team } = Route.useLoaderData();

	return (
		<Await
			promise={team}
			fallback={<TeamSkeleton isAdmin={program.role === "admin"} />}
		>
			{(team) => <Team team={team} />}
		</Await>
	);
}

const INVITE_INTRO =
	"They get an email with a link that signs them in, no password needed. Team members issue cards, add points, scan cards and message customers. Only admins change the program and manage the team.";

/** `Team` while it loads: the program already tells whether you are an admin. */
function TeamSkeleton({ isAdmin }: { isAdmin: boolean }) {
	return (
		<div aria-hidden className="flex flex-col gap-10">
			{isAdmin ? (
				<section className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<h2 className="font-semibold text-lg">Invite someone</h2>
						<p className="text-muted-foreground text-sm">{INVITE_INTRO}</p>
					</div>
					<InviteFormSkeleton />
				</section>
			) : null}
			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-lg">Team</h2>
				<TeamMemberListSkeleton />
			</section>
		</div>
	);
}

function Team({ team }: { team: Awaited<ReturnType<typeof getTeam>> }) {
	const { programId } = Route.useParams();
	const router = useRouter();
	const navigate = useNavigate();
	const inviteFn = useServerFn(inviteTeamMember);
	const cancelFn = useServerFn(cancelInvitation);
	const removeFn = useServerFn(removeTeamMember);
	/** Email of an invitation whose email could not be sent. */
	const [unsentTo, setUnsentTo] = useState<string | null>(null);
	const isAdmin = team.role === "admin";

	async function invite(email: string) {
		setUnsentTo(null);
		const { sent } = await inviteFn({ data: { programId, email } });
		await router.invalidate({ sync: true });
		if (sent) {
			toast.add({
				type: "success",
				title: `Invitation sent to ${email}.`,
				description: "The link in the email expires in 7 days.",
			});
		} else {
			setUnsentTo(email);
		}
	}

	return (
		<div className="flex flex-col gap-10">
			{isAdmin ? (
				<section className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<h2 className="font-semibold text-lg">Invite someone</h2>
						<p className="text-muted-foreground text-sm">{INVITE_INTRO}</p>
					</div>
					{team.emailsEnabled ? (
						<>
							<FormAlert>
								{unsentTo
									? `The invitation for ${unsentTo} is saved, but the email could not be sent. Send it again in a moment.`
									: null}
							</FormAlert>
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
							setUnsentTo(null);
							await router.invalidate({ sync: true });
						}}
					/>
				</section>
			) : null}
		</div>
	);
}
