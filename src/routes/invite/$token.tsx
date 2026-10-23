import {
	createFileRoute,
	notFound,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCurrentUser } from "#/features/auth/auth.functions";
import { AuthCard } from "#/features/auth/components/auth-card";
import { getInvitation, joinTeam } from "#/features/team/team.functions";
import { invitationTokenSchema } from "#/features/team/team.schemas";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";

/**
 * The link of a team invitation, only ever sent by email. Joining signs the
 * invitee in as the invited email, without a password. Joining takes a
 * click: email scanners open links, and must not use the invitation up.
 */
export const Route = createFileRoute("/invite/$token")({
	loader: async ({ params }) => {
		if (!invitationTokenSchema.safeParse(params).success) {
			throw notFound();
		}
		const [invitation, user] = await Promise.all([
			getInvitation({ data: { token: params.token } }),
			getCurrentUser(),
		]);
		return { invitation, signedInEmail: user?.email ?? null };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: loaderData
					? `Join the ${loaderData.invitation.programName} team`
					: "Invitation not found",
			},
		],
	}),
	component: InvitePage,
	notFoundComponent: () => (
		<main className="flex min-h-svh items-center justify-center p-6">
			<p className="max-w-sm text-center text-muted-foreground">
				This invitation is invalid, was already used or has expired. Ask the
				program's admin for a new one.
			</p>
		</main>
	),
});

function InvitePage() {
	const { token } = Route.useParams();
	const { invitation, signedInEmail } = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate();
	const joinFn = useServerFn(joinTeam);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const otherAccount =
		signedInEmail !== null &&
		signedInEmail.toLowerCase() !== invitation.email.toLowerCase();

	async function join() {
		setPending(true);
		setError(null);
		try {
			const { programId } = await joinFn({ data: { token } });
			await navigate({ to: "/programs/$programId", params: { programId } });
			await router.invalidate();
		} catch (joinError) {
			setError(
				joinError instanceof Error
					? joinError.message
					: "Could not join the team.",
			);
			setPending(false);
		}
	}

	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<AuthCard
				title={`Join the ${invitation.programName} team`}
				description={`You are invited to manage the ${invitation.programName} loyalty program on Loylo.`}
			>
				<div className="flex flex-col gap-4 text-sm">
					<p>
						You will be signed in as {invitation.email}, no password needed.
						{otherAccount ? ` This signs ${signedInEmail} out.` : null}
					</p>
					<FormAlert>{error}</FormAlert>
					<Button disabled={pending} onClick={join}>
						{pending ? "Joining…" : "Join the team"}
					</Button>
				</div>
			</AuthCard>
		</main>
	);
}
