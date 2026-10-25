import { Link } from "@tanstack/react-router";

import { WalletStateBadge } from "#/features/members/components/wallet-state-badge";
import type { MemberListItem } from "#/features/members/members.server";
import type { ProgramKind } from "#/features/programs/programs.schemas";
import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";
import { formatStampBalance } from "#/lib/wallet/balance";
import { Spinner } from "@/components/ui/spinner";

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
export function MemberListLoader() {
	return (
		<div className="flex justify-center rounded-2xl border bg-surface py-12">
			<Spinner className="size-6 text-muted-foreground" />
		</div>
	);
}
