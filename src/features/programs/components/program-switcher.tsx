import { RiAddLine, RiArrowUpDownLine, RiCheckLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";

import type { ProgramView } from "#/features/programs/programs.server";
import { pickForegroundColor } from "#/lib/colors";
import { cn } from "#/lib/utils";
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

/** The program's colored badge: its logo, or its initial. */
function ProgramBadge({
	program,
	className,
}: {
	program: ProgramView;
	className: string;
}) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden font-semibold",
				className,
			)}
			style={{
				backgroundColor: program.backgroundColor,
				color: pickForegroundColor(program.backgroundColor),
			}}
		>
			{program.logoUrl ? (
				<img
					src={program.logoUrl}
					alt=""
					className="size-full object-contain p-1"
				/>
			) : (
				program.name.charAt(0).toUpperCase()
			)}
		</div>
	);
}

/**
 * Top of the sidebar: the card the merchant is working on, and a menu to
 * switch to another one or create a new one.
 */
export function ProgramSwitcher({
	programs,
	activeProgram,
}: {
	programs: ProgramView[];
	activeProgram: ProgramView | undefined;
}) {
	if (!activeProgram) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" render={<Link to="/programs/new" />}>
						<div className="flex size-8 items-center justify-center rounded-lg border">
							<RiAddLine />
						</div>
						<span className="truncate font-medium">Create a program</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

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
						<ProgramBadge
							program={activeProgram}
							className="size-8 rounded-lg"
						/>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{activeProgram.name}</span>
							<span className="truncate text-muted-foreground text-xs">
								Loyalty card
							</span>
						</div>
						<RiArrowUpDownLine className="ml-auto" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" side="bottom" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-muted-foreground text-xs">
								Programs
							</DropdownMenuLabel>
							{programs.map((program) => (
								<DropdownMenuItem
									key={program.id}
									className="gap-2 p-2"
									render={
										<Link
											to="/programs/$programId"
											params={{ programId: program.id }}
										/>
									}
								>
									<ProgramBadge
										program={program}
										className="size-6 rounded-md"
									/>
									<span className="truncate">{program.name}</span>
									{program.id === activeProgram.id ? (
										<RiCheckLine className="ml-auto" />
									) : null}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="gap-2 p-2"
								render={<Link to="/programs/new" />}
							>
								<div className="flex size-6 items-center justify-center rounded-md border">
									<RiAddLine />
								</div>
								<span className="font-medium text-muted-foreground">
									New program
								</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
