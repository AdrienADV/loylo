import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { signOut } from "#/features/auth/auth.functions";
import { getAuthedLayout } from "#/features/programs/programs.functions";
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
 *
 * The check is in the loader rather than `beforeLoad`: `beforeLoad` runs on
 * every navigation, which cost a request to the Worker on each click, while
 * a loader stays cached as long as its route stays on screen. A session that
 * ends in the meantime is caught by the next server function the page calls.
 */
export const Route = createFileRoute("/_authed")({
	loader: async ({ location }) => {
		const layout = await getAuthedLayout();
		if (!layout) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
		// The sidebar lists every program to switch between them.
		return layout;
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	const { user, programs } = Route.useLoaderData();
	const { programId } = useParams({ strict: false });
	const navigate = useNavigate();
	const router = useRouter();
	const signOutFn = useServerFn(signOut);

	// Outside a program's pages, the sidebar focuses on the newest program.
	const activeProgram =
		programs.find((program) => program.id === programId) ?? programs[0];

	async function handleSignOut() {
		await signOutFn();
		await navigate({ to: "/login" });
		// Drops the signed-in pages kept in memory, so they can't show again.
		router.clearCache();
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
