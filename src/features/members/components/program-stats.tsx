import type { ProgramStats as Stats } from "#/features/members/members.server";
import { SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** How a number reads for the merchant: good news, a warning, or neither. */
type Tone = "positive" | "negative" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
	positive: "bg-success/10 text-success",
	negative: "bg-destructive/10 text-destructive",
	neutral: "bg-background text-muted-foreground",
};

/** Below this share of members with the card in a wallet, nudge the merchant. */
const LOW_WALLET_SHARE = 50;

/** The program's headline numbers, first thing the merchant sees. */
export function ProgramStats({ stats }: { stats: Stats }) {
	const walletShare =
		stats.members > 0
			? Math.round((stats.membersInWallet / stats.members) * 100)
			: 0;
	const hasMembers = stats.members > 0;

	return (
		<dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<StatTile
				label="Members"
				value={stats.members}
				detail={`+${stats.newMembers} in the last 30 days`}
				tone={
					stats.newMembers > 0
						? "positive"
						: hasMembers
							? "negative"
							: "neutral"
				}
			/>
			<StatTile
				label="Cards in a wallet"
				value={stats.membersInWallet}
				detail={`${walletShare}% of members`}
				tone={
					!hasMembers
						? "neutral"
						: walletShare >= LOW_WALLET_SHARE
							? "positive"
							: "negative"
				}
			/>
			<StatTile
				label="Visits"
				value={stats.pointAdditions}
				detail="Points added, last 30 days"
				tone={
					stats.pointAdditions > 0
						? "positive"
						: hasMembers
							? "negative"
							: "neutral"
				}
			/>
			<StatTile
				label="Rewards redeemed"
				value={stats.redemptions}
				detail="Last 30 days"
				tone={stats.redemptions > 0 ? "positive" : "neutral"}
			/>
		</dl>
	);
}

function StatTile({
	label,
	value,
	detail,
	tone,
}: {
	label: string;
	value: number;
	detail: string;
	tone: Tone;
}) {
	return (
		<div className="flex min-w-0 flex-col items-start gap-1 rounded-2xl border bg-surface px-4 py-3">
			<dt className="max-w-full truncate text-muted-foreground text-sm">
				{label}
			</dt>
			<dd className="font-semibold text-2xl tabular-nums">{value}</dd>
			<dd
				className={cn(
					"max-w-full truncate rounded-full px-2 py-0.5 font-medium text-xs",
					TONE_CLASSES[tone],
				)}
			>
				{detail}
			</dd>
		</div>
	);
}

const STAT_LABELS = [
	"Members",
	"Cards in a wallet",
	"Visits",
	"Rewards redeemed",
];

/** `ProgramStats` while the numbers load. */
export function ProgramStatsSkeleton() {
	return (
		<div aria-hidden className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{STAT_LABELS.map((label) => (
				<div
					key={label}
					className="flex min-w-0 flex-col items-start gap-1 rounded-2xl border bg-surface px-4 py-3"
				>
					<span className="max-w-full truncate text-muted-foreground text-sm">
						{label}
					</span>
					<SkeletonText className="w-12 text-2xl" />
					<Skeleton className="h-5 w-32 max-w-full rounded-full" />
				</div>
			))}
		</div>
	);
}
