import { Wordmark } from "./wordmark";

const COLUMNS = [
	{
		title: "Product",
		links: [
			{ href: "/#how-it-works", label: "How it works" },
			{ href: "/#features", label: "Features" },
			{ href: "/#businesses", label: "Who it's for" },
			{ href: "/#faq", label: "FAQ" },
		],
	},
	{
		title: "Resources",
		links: [{ href: "/blog", label: "Blog" }],
	},
	{
		title: "Account",
		links: [
			{ href: "/signup", label: "Create an account" },
			{ href: "/login", label: "Sign in" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer className="border-border/60 border-t">
			<div className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
				<div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
					<div className="flex flex-col items-start gap-4">
						<Wordmark />
						<p className="max-w-xs text-pretty text-muted-foreground text-sm">
							Loyalty cards in Apple Wallet and Google Wallet, for coffee shops,
							food trucks and every shop with regulars.
						</p>
					</div>
					<nav
						aria-label="Footer"
						className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3"
					>
						{COLUMNS.map(({ title, links }) => (
							<div key={title} className="flex flex-col gap-3">
								<p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
									{title}
								</p>
								<ul className="flex flex-col gap-2 text-sm">
									{links.map(({ href, label }) => (
										<li key={href}>
											<a
												href={href}
												className="text-foreground/80 transition-colors hover:text-foreground"
											>
												{label}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</div>
				<div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-border/60 border-t pt-6 text-muted-foreground text-xs">
					<p>© {new Date().getFullYear()} Loylo</p>
					<p>Made for shops with regulars.</p>
				</div>
			</div>
		</footer>
	);
}
