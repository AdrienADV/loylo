import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { listPrograms } from "#/features/programs/programs.functions";
import { buttonVariants } from "@/components/ui/button";

/**
 * Landing page after sign-in. Everything happens inside a program, so this
 * opens the newest one and only shows up while there is none yet.
 */
export const Route = createFileRoute("/_authed/dashboard")({
	loader: async () => {
		const [newest] = await listPrograms();
		if (newest) {
			throw redirect({
				to: "/programs/$programId",
				params: { programId: newest.id },
			});
		}
	},
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<section className="flex flex-col items-start gap-4">
			<h1 className="font-semibold text-2xl">Welcome to Loylo</h1>
			<p className="text-muted-foreground">
				You have no loyalty program yet. Create one to design your card.
			</p>
			<Link to="/programs/new" className={buttonVariants()}>
				New program
			</Link>
		</section>
	);
}
