import { Link } from "@tanstack/react-router";

/** The Loylo name with its mark: a card with a filled stamp. */
export function Wordmark() {
	return (
		<Link
			to="/"
			className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1"
			aria-label="Loylo home"
		>
			<svg
				viewBox="0 0 24 24"
				className="size-6"
				fill="none"
				aria-hidden="true"
			>
				<rect x="2" y="4" width="20" height="16" rx="4" fill="currentColor" />
				<circle cx="8" cy="12" r="2.5" className="fill-background" />
				<circle
					cx="16"
					cy="12"
					r="2.5"
					className="stroke-background"
					strokeWidth="1.5"
				/>
			</svg>
			<span className="font-semibold text-[17px] tracking-tight">Loylo</span>
		</Link>
	);
}
