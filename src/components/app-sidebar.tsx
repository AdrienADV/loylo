import {
	RiGroupLine,
	RiMessage2Line,
	RiSettings3Line,
	RiShareForwardLine,
	RiUserAddLine,
} from "@remixicon/react";
import { Link, useMatchRoute } from "@tanstack/react-router";

import { ProgramSwitcher } from "#/features/programs/components/program-switcher";
import type { ProgramView } from "#/features/programs/programs.server";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({
	programs,
	activeProgram,
	email,
	onSignOut,
}: {
	programs: ProgramView[];
	activeProgram: ProgramView | undefined;
	email: string;
	onSignOut: () => void;
}) {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<ProgramSwitcher programs={programs} activeProgram={activeProgram} />
			</SidebarHeader>
			<SidebarContent>
				{activeProgram ? <ProgramNav programId={activeProgram.id} /> : null}
			</SidebarContent>
			<SidebarFooter>
				<NavUser email={email} onSignOut={onSignOut} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

const programLinks = [
	{
		title: "Members",
		to: "/programs/$programId",
		icon: RiGroupLine,
		exact: true,
	},
	{
		title: "Issue a card",
		to: "/programs/$programId/members/new",
		icon: RiUserAddLine,
	},
	{
		title: "Messages",
		to: "/programs/$programId/notifications",
		icon: RiMessage2Line,
	},
	{
		title: "Share",
		to: "/programs/$programId/share",
		icon: RiShareForwardLine,
	},
	{
		title: "Settings",
		to: "/programs/$programId/settings",
		icon: RiSettings3Line,
	},
] as const;

/** The pages of the selected program. */
function ProgramNav({ programId }: { programId: string }) {
	const matchRoute = useMatchRoute();
	const params = { programId };
	// A member's page belongs to the members list.
	const onMemberPage =
		Boolean(
			matchRoute({ to: "/programs/$programId/members/$memberId", params }),
		) && !matchRoute({ to: "/programs/$programId/members/new", params });

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Program</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{programLinks.map((link) => {
						const isActive =
							Boolean(
								matchRoute({
									to: link.to,
									params,
									fuzzy: !("exact" in link),
								}),
							) ||
							("exact" in link && onMemberPage);
						return (
							<SidebarMenuItem key={link.to}>
								<SidebarMenuButton
									tooltip={link.title}
									isActive={isActive}
									render={<Link to={link.to} params={params} />}
								>
									<link.icon />
									<span>{link.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
