import {
	RiArrowUpDownLine,
	RiLogoutBoxLine,
	RiUserLine,
} from "@remixicon/react";
import { Link } from "@tanstack/react-router";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

/** Bottom of the sidebar: the signed-in merchant, their account and sign out. */
export function NavUser({
	email,
	onSignOut,
}: {
	email: string;
	onSignOut: () => void;
}) {
	const initial = email.charAt(0).toUpperCase();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
							/>
						}
					>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-medium">
							{initial}
						</div>
						<span className="flex-1 truncate text-left text-sm">{email}</span>
						<RiArrowUpDownLine className="ml-auto" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" side="top" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="truncate font-normal text-muted-foreground text-xs">
								{email}
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem render={<Link to="/account" />}>
								<RiUserLine />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onSignOut}>
								<RiLogoutBoxLine />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
