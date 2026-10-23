import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** The landing page and the blog: header, content, footer. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-svh flex-col">
			<SiteHeader />
			<div className="flex-1">{children}</div>
			<SiteFooter />
		</div>
	);
}

/** The small label above a section's headline. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
			{children}
		</p>
	);
}

export const DISPLAY_HEADING =
	"font-display font-[480] tracking-[-0.03em] text-balance";
