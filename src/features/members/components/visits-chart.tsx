import { useHydrated } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { groupVisitsByDay } from "#/features/members/daily-visits";
import type { HourlyVisits } from "#/features/members/members.server";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = 30;

const chartConfig = {
	visits: { label: "Visits", color: "var(--primary)" },
} satisfies ChartConfig;

/** A `YYYY-MM-DD` day as the merchant reads it: "Oct 24", "Sat, Oct 24". */
function formatDay(day: string, withWeekday = false): string {
	return new Intl.DateTimeFormat("en", {
		weekday: withWeekday ? "short" : undefined,
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${day}T00:00:00Z`));
}

/** Visits of each of the last 30 days, in the viewer's time zone. */
export function VisitsChart({ hours }: { hours: HourlyVisits[] }) {
	// The server does not know the viewer's time zone: like `FormattedDate`,
	// the server render (and hydration) count UTC days.
	const hydrated = useHydrated();
	const days = groupVisitsByDay(hours, {
		now: new Date(),
		days: DAYS,
		timeZone: hydrated ? undefined : "UTC",
	});
	const total = days.reduce((sum, day) => sum + day.visits, 0);

	return (
		<VisitsCard>
			{total > 0 ? (
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-48 w-full"
					aria-label={`${total} visits over the last ${DAYS} days`}
				>
					<BarChart data={days} margin={{ top: 4, right: 0, left: 0 }}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={24}
							tickFormatter={(day: string) => formatDay(day)}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={(day) => formatDay(String(day), true)}
								/>
							}
						/>
						<Bar
							dataKey="visits"
							fill="var(--color-visits)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			) : (
				<p className="flex h-48 items-center justify-center text-center text-muted-foreground text-sm">
					No visits in the last {DAYS} days.
				</p>
			)}
		</VisitsCard>
	);
}

function VisitsCard({ children }: { children: ReactNode }) {
	return (
		<section className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-surface px-4 py-3">
			<div className="flex flex-col">
				<h2 className="font-medium text-sm">Visits per day</h2>
				<p className="text-muted-foreground text-sm">Last {DAYS} days</p>
			</div>
			{children}
		</section>
	);
}

/** `VisitsChart` while the visits load. */
export function VisitsChartSkeleton() {
	return (
		<div aria-hidden>
			<VisitsCard>
				<Skeleton className="h-48 w-full" />
			</VisitsCard>
		</div>
	);
}
