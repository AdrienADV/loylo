import {
	Await,
	createFileRoute,
	getRouteApi,
	Link,
	notFound,
} from "@tanstack/react-router";
import { z } from "zod";
import {
	ProgramStats,
	ProgramStatsSkeleton,
} from "#/features/members/components/program-stats";
import {
	VisitsChart,
	VisitsChartSkeleton,
} from "#/features/members/components/visits-chart";
import {
	getProgramStats,
	getProgramVisits,
} from "#/features/members/members.functions";
import { FormAlert } from "@/components/form-alert";
import { buttonVariants } from "@/components/ui/button";

const programRoute = getRouteApi("/_authed/programs/$programId");

export const Route = createFileRoute("/_authed/programs/$programId/")({
	validateSearch: z.object({
		walletSync: z.literal("failed").optional().catch(undefined),
	}),
	// Not awaited: the page shows at once, with skeletons until the data comes.
	loader: ({ params }) => {
		if (!z.uuid().safeParse(params.programId).success) {
			throw notFound();
		}
		const data = { programId: params.programId };
		return {
			stats: getProgramStats({ data }),
			visits: getProgramVisits({ data }),
		};
	},
	component: ProgramOverviewPage,
});

/** What the merchant sees first: how the program does, and the main action. */
function ProgramOverviewPage() {
	const { stats, visits } = Route.useLoaderData();
	const { walletSync } = Route.useSearch();
	const program = programRoute.useLoaderData();

	return (
		<div className="flex flex-col gap-6">
			{walletSync === "failed" ? (
				<FormAlert>
					The program is saved, but Google Wallet could not be updated. Save it
					again from the settings to retry.
				</FormAlert>
			) : null}
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<h2 className="font-semibold text-lg">Overview</h2>
				<Link
					to="/programs/$programId/members/new"
					params={{ programId: program.id }}
					className={buttonVariants()}
				>
					Issue a card
				</Link>
			</div>
			<Await
				promise={stats}
				fallback={<ProgramStatsSkeleton kind={program.kind} />}
			>
				{(stats) => <ProgramStats stats={stats} kind={program.kind} />}
			</Await>
			<Await promise={visits} fallback={<VisitsChartSkeleton />}>
				{(hours) => <VisitsChart hours={hours} />}
			</Await>
		</div>
	);
}
