import { RiMenuLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

const LINKS = [
	{ href: "/#how-it-works", label: "How it works" },
	{ href: "/#features", label: "Features" },
	{ href: "/#pricing", label: "Pricing" },
	{ href: "/#faq", label: "FAQ" },
	{ href: "/blog", label: "Blog" },
];

/**
 * Header of the public pages. On phones the links sit in a native popover,
 * plain links so it closes on the next page.
 */
export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-border/60 border-b bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
				<Wordmark />
				<nav aria-label="Main" className="flex items-center gap-1">
					<span className="hidden items-center gap-1 md:flex">
						{LINKS.map(({ href, label }) => (
							<a
								key={href}
								href={href}
								className={buttonVariants({
									variant: "ghost",
									size: "sm",
									className: "text-muted-foreground",
								})}
							>
								{label}
							</a>
						))}
						<Link
							to="/login"
							className={buttonVariants({
								variant: "ghost",
								size: "sm",
								className: "text-muted-foreground",
							})}
						>
							Sign in
						</Link>
					</span>
					<Link
						to="/signup"
						className={buttonVariants({ size: "sm", className: "ml-1.5" })}
					>
						Get started
					</Link>
					<button
						type="button"
						popoverTarget="site-menu"
						aria-label="Menu"
						className={buttonVariants({
							variant: "ghost",
							size: "icon-sm",
							className: "md:hidden",
						})}
					>
						<RiMenuLine />
					</button>
					<div
						id="site-menu"
						popover="auto"
						className="inset-x-3 top-16 bottom-auto m-0 w-auto rounded-2xl bg-popover p-2 text-popover-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_40px_-12px_rgb(0_0_0/0.3)] md:hidden"
					>
						<ul className="flex flex-col">
							{[...LINKS, { href: "/login", label: "Sign in" }].map(
								({ href, label }) => (
									<li key={href}>
										<a
											href={href}
											className="flex h-11 items-center rounded-lg px-3 font-medium text-[15px] transition-colors hover:bg-muted"
										>
											{label}
										</a>
									</li>
								),
							)}
						</ul>
					</div>
				</nav>
			</div>
		</header>
	);
}
