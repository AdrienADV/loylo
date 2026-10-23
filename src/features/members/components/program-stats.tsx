import type { ProgramStats as Stats } from "#/features/members/members.server";

/** The program's headline numbers, first thing the merchant sees. */
export function ProgramStats({ stats }: { stats: Stats }) {
	const walletShare =
		stats.members > 0
			? Math.round((stats.membersInWallet / stats.members) * 100)
			: 0;

	return (
		<dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<StatTile
				label="Members"
				value={stats.members}
				detail={`+${stats.newMembers} in the last 30 days`}
			/>
			<StatTile
				label="Cards in a wallet"
				value={stats.membersInWallet}
				detail={`${walletShare}% of members`}
			/>
			<StatTile
				label="Visits"
				value={stats.pointAdditions}
				detail="Points added, last 30 days"
			/>
			<StatTile
				label="Rewards redeemed"
				value={stats.redemptions}
				detail="Last 30 days"
			/>
		</dl>
	);
}

function StatTile({
	label,
	value,
	detail,
}: {
	label: string;
	value: number;
	detail: string;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1 rounded-2xl border px-4 py-3">
			<dt className="truncate text-muted-foreground text-sm">{label}</dt>
			<dd className="font-semibold text-2xl tabular-nums">{value}</dd>
			<dd className="truncate text-muted-foreground text-xs">{detail}</dd>
		</div>
	);
}
