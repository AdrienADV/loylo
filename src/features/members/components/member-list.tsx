import { Link } from "@tanstack/react-router";

import { WalletStateBadge } from "#/features/members/components/wallet-state-badge";
import type { MemberListItem } from "#/features/members/members.server";
import type { ProgramKind } from "#/features/programs/programs.schemas";
import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";
import { formatStampBalance } from "#/lib/wallet/balance";
import { SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export function MemberList({
	programId,
	kind,
	members,
}: {
	programId: string;
	kind: ProgramKind;
	members: MemberListItem[];
}) {
	return (
		<ul className="divide-y overflow-hidden rounded-2xl border bg-surface">
			{members.map((member) => (
				<li key={member.id}>
					<Link
						to="/programs/$programId/members/$memberId"
						params={{ programId, memberId: member.id }}
						className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-foreground/[0.03]"
					>
						<div className="flex min-w-0 flex-col gap-1">
							<span className="truncate font-medium">{member.name}</span>
							<span className="truncate text-muted-foreground text-sm">
								{member.email}
							</span>
							<span className="flex flex-wrap gap-1.5">
								{member.wallets.map((wallet) => (
									<WalletStateBadge key={wallet.provider} {...wallet} />
								))}
							</span>
						</div>
						<span className="flex shrink-0 flex-col items-end">
							<span className="font-semibold text-lg tabular-nums">
								{kind === "stamps"
									? formatStampBalance(member.stamps, STAMPS_PER_CARD)
									: member.points}
							</span>
							<span className="text-muted-foreground text-xs">{kind}</span>
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

/** `MemberList` while the members load. */
export function MemberListSkeleton({
	kind,
	rows = 5,
}: {
	kind: ProgramKind;
	rows?: number;
}) {
	return (
		<ul
			aria-hidden
			className="divide-y overflow-hidden rounded-2xl border bg-surface"
		>
			{Array.from({ length: rows }, (_, index) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
					key={index}
					className="flex items-center justify-between gap-4 px-4 py-3"
				>
					<div className="flex min-w-0 flex-col gap-1">
						<SkeletonText className="w-32" />
						<SkeletonText className="w-48 text-sm" />
						<span className="flex flex-wrap gap-1.5">
							<Skeleton className="h-5 w-36 rounded-full" />
						</span>
					</div>
					<span className="flex shrink-0 flex-col items-end">
						<SkeletonText className="w-8 text-lg" />
						<span className="text-muted-foreground text-xs">{kind}</span>
					</span>
				</li>
			))}
		</ul>
	);
}
