import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, signOut } from "#/features/auth/auth.functions";
import { listPrograms } from "#/features/programs/programs.functions";
import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Pages for signed-in merchants. This guard only decides what the browser
 * shows; server functions check the session themselves (`authMiddleware`).
 */
export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		const user = await getCurrentUser();
		if (!user) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
		return { user };
	},
	// The sidebar lists every program to switch between them.
	loader: () => listPrograms(),
	component: AuthedLayout,
});

function AuthedLayout() {
	const { user } = Route.useRouteContext();
	const programs = Route.useLoaderData();
	const { programId } = useParams({ strict: false });
	const navigate = useNavigate();
	const signOutFn = useServerFn(signOut);

	// Outside a program's pages, the sidebar focuses on the newest program.
	const activeProgram =
		programs.find((program) => program.id === programId) ?? programs[0];

	async function handleSignOut() {
		await signOutFn();
		await navigate({ to: "/login" });
	}

	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar
					programs={programs}
					activeProgram={activeProgram}
					email={user.email}
					onSignOut={handleSignOut}
				/>
				<SidebarInset>
					<header className="flex h-12 shrink-0 items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
					</header>
					<main className="mx-auto w-full max-w-5xl p-6 pt-2">
						<Outlet />
					</main>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
