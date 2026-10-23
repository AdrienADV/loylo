import { RiCheckLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DISPLAY_HEADING, Eyebrow } from "./site-layout";

type Period = "month" | "year";

const PERIODS: { value: Period; label: string }[] = [
	{ value: "month", label: "Monthly" },
	{ value: "year", label: "Yearly" },
];

/** Prices in euros a month, by billing period. */
const PLANS = [
	{
		name: "Pro",
		description: "For a shop with regulars.",
		prices: { month: 15, year: 12 },
		cta: "Get started",
		isFeatured: true,
		features: [
			"1 loyalty card",
			"Unlimited customers",
			"Apple Wallet and Google Wallet",
			"8 messages a month on the card",
			"Up to 3 team members",
		],
	},
	{
		name: "Multi-shop",
		description: "For several shops or brands.",
		prices: { month: 39, year: 32 },
		cta: "Get started",
		features: [
			"Up to 5 loyalty cards",
			"Unlimited customers",
			"Apple Wallet and Google Wallet",
			"30 messages a month on the card",
			"Up to 15 team members",
		],
	},
];

export function Pricing() {
	const [period, setPeriod] = useState<Period>("month");

	return (
		<section
			id="pricing"
			className="scroll-mt-14 border-border/60 border-y bg-card/60"
		>
			<div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
				<div className="flex flex-wrap items-end justify-between gap-6">
					<header className="flex max-w-2xl flex-col gap-4">
						<Eyebrow>Pricing</Eyebrow>
						<h2
							className={`${DISPLAY_HEADING} text-[2.25rem] leading-[1.08] sm:text-5xl`}
						>
							A flat price, whatever your number of customers
						</h2>
						<p className="text-[17px] text-muted-foreground leading-8">
							No fee per customer or per visit, no hardware, cancel anytime.
						</p>
					</header>
					<fieldset className="inline-flex items-center gap-1 rounded-xl bg-muted/70 p-1">
						<legend className="sr-only">Billing</legend>
						{PERIODS.map(({ value, label }) => (
							<label
								key={value}
								className="flex h-8 cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-lg px-3 font-medium text-muted-foreground text-sm transition-[color,background-color,box-shadow] duration-150 hover:text-foreground has-checked:bg-background has-checked:text-foreground has-checked:shadow-border has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
							>
								<input
									type="radio"
									name="pricing-period"
									value={value}
									checked={period === value}
									onChange={() => setPeriod(value)}
									className="sr-only"
								/>
								{label}
								{value === "year" && (
									<span className="font-normal text-success text-xs">−20%</span>
								)}
							</label>
						))}
					</fieldset>
				</div>
				<div className="mt-12 grid gap-3 md:grid-cols-2">
					{PLANS.map((plan) => (
						<article
							key={plan.name}
							className={cn(
								"flex flex-col gap-6 rounded-2xl bg-background p-6 sm:p-8",
								plan.isFeatured
									? "shadow-[0_0_0_2px_var(--foreground)]"
									: "shadow-border",
							)}
						>
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between gap-3">
									<h3 className="font-semibold text-lg tracking-tight">
										{plan.name}
									</h3>
									{plan.isFeatured && (
										<span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] text-background">
											Most popular
										</span>
									)}
								</div>
								<p className="text-muted-foreground text-sm">
									{plan.description}
								</p>
							</div>
							<div className="flex flex-col gap-1">
								<p className="flex items-baseline gap-1.5">
									<span className="font-[440] font-display text-6xl tabular-nums leading-none tracking-[-0.03em]">
										€{plan.prices[period]}
									</span>
									<span className="text-muted-foreground text-sm">/ month</span>
								</p>
								<p className="h-5 text-muted-foreground text-xs">
									{period === "year"
										? `€${plan.prices.year * 12} billed yearly`
										: "Billed monthly"}
								</p>
							</div>
							<Link
								to="/signup"
								className={buttonVariants({
									variant: plan.isFeatured ? "default" : "secondary",
									size: "lg",
								})}
							>
								{plan.cta}
							</Link>
							<ul className="flex flex-col gap-2.5 border-border/60 border-t pt-6 text-sm">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2.5">
										<RiCheckLine className="mt-0.5 size-4 shrink-0 text-success" />
										{feature}
									</li>
								))}
							</ul>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
