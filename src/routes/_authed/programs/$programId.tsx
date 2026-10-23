import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { getProgram } from "#/features/programs/programs.functions";

export const Route = createFileRoute("/_authed/programs/$programId")({
	loader: ({ params }) => {
		if (!z.uuid().safeParse(params.programId).success) {
			throw notFound();
		}
		return getProgram({ data: { programId: params.programId } });
	},
	component: ProgramLayout,
	notFoundComponent: () => (
		<p className="text-muted-foreground">This program does not exist.</p>
	),
});

function ProgramLayout() {
	const program = Route.useLoaderData();

	return (
		<section className="flex flex-col gap-6">
			<h1 className="font-semibold text-2xl">{program.name}</h1>
			<Outlet />
		</section>
	);
}
