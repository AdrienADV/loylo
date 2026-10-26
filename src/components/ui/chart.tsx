import { cn } from "cn";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

// The subset of shadcn/ui's chart component the app uses, with the same API.

export type ChartConfig = Record<
	string,
	{ label?: React.ReactNode; color?: string }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}
	return context;
}

/** Sizes the chart and exposes each series' color as `--color-<key>`. */
function ChartContainer({
	config,
	className,
	style,
	children,
	...props
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
	children: React.ComponentProps<
		typeof RechartsPrimitive.ResponsiveContainer
	>["children"];
}) {
	const colors = Object.fromEntries(
		Object.entries(config).flatMap(([key, item]) =>
			item.color ? [[`--color-${key}`, item.color]] : [],
		),
	);

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-slot="chart"
				style={{ ...colors, ...style }}
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-surface]:outline-hidden",
					className,
				)}
				{...props}
			>
				<RechartsPrimitive.ResponsiveContainer>
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
	active,
	payload,
	label,
	labelFormatter,
	className,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
	className?: string;
	active?: boolean;
	payload?: ReadonlyArray<{
		dataKey?: unknown;
		value?: unknown;
		payload?: unknown;
	}>;
	label?: unknown;
}) {
	const { config } = useChart();

	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"grid min-w-32 gap-1.5 rounded-2xl border bg-popover px-3 py-2 text-popover-foreground text-xs shadow-md",
				className,
			)}
		>
			<div className="font-medium">
				{labelFormatter
					? labelFormatter(label as React.ReactNode, payload as never)
					: (label as React.ReactNode)}
			</div>
			{payload.map((item) => {
				const key = String(item.dataKey);
				return (
					<div key={key} className="flex items-center gap-2">
						<span
							className="size-2.5 shrink-0 rounded-[2px]"
							style={{ backgroundColor: `var(--color-${key})` }}
						/>
						<span className="text-muted-foreground">
							{config[key]?.label ?? key}
						</span>
						<span className="ml-auto font-medium font-mono tabular-nums">
							{Number(item.value).toLocaleString()}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
