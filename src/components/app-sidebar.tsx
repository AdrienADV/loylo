import { AnimateIcon } from "@animate-ui/react/icons";
import { Link, useMatchRoute } from "@tanstack/react-router";

import { ProgramSwitcher } from "#/features/programs/components/program-switcher";
import type { TeamProgramView } from "#/features/programs/programs.server";
import { CreditCardIcon } from "@/components/animate-ui/icons/credit-card";
import { ForwardIcon } from "@/components/animate-ui/icons/forward";
import { MessageSquareIcon } from "@/components/animate-ui/icons/message-square";
import { SettingsIcon } from "@/components/animate-ui/icons/settings";
import { UsersIcon } from "@/components/animate-ui/icons/users";
import { UsersRoundIcon } from "@/components/animate-ui/icons/users-round";
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
	programs: TeamProgramView[];
	activeProgram: TeamProgramView | undefined;
	email: string;
	onSignOut: () => void;
}) {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<ProgramSwitcher programs={programs} activeProgram={activeProgram} />
			</SidebarHeader>
			<SidebarContent>
				{activeProgram ? (
					<ProgramNav
						programId={activeProgram.id}
						isAdmin={activeProgram.role === "admin"}
					/>
				) : null}
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
		icon: UsersIcon,
		exact: true,
	},
	{
		title: "Issue a card",
		to: "/programs/$programId/members/new",
		icon: CreditCardIcon,
	},
	{
		title: "Messages",
		to: "/programs/$programId/notifications",
		icon: MessageSquareIcon,
	},
	{
		title: "Share",
		to: "/programs/$programId/share",
		icon: ForwardIcon,
	},
	{
		title: "Team",
		to: "/programs/$programId/team",
		icon: UsersRoundIcon,
	},
	{
		title: "Settings",
		to: "/programs/$programId/settings",
		icon: SettingsIcon,
		adminOnly: true,
	},
] as const;

/** The pages of the selected program. */
function ProgramNav({
	programId,
	isAdmin,
}: {
	programId: string;
	isAdmin: boolean;
}) {
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
					{programLinks
						.filter((link) => isAdmin || !("adminOnly" in link))
						.map((link) => {
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
								// The icon plays while the whole item is hovered.
								<AnimateIcon key={link.to} animateOnHover asChild>
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip={link.title}
											isActive={isActive}
											render={<Link to={link.to} params={params} />}
										>
											<link.icon />
											<span>{link.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</AnimateIcon>
							);
						})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
