import {
	type RemixiconComponentType,
	RiAddLine,
	RiBankCardLine,
	RiDeleteBin6Line,
	RiGift2Line,
	RiSparkling2Line,
	RiWallet3Line,
} from "@remixicon/react";
import {
	createFileRoute,
	Link,
	notFound,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { PointsForm } from "#/features/members/components/points-form";
import {
	INSTALL_STATE_LABELS,
	WALLET_NAMES,
} from "#/features/members/components/wallet-state-badge";
import {
	adjustPoints,
	getMember,
	listTransactions,
	retryWalletSync,
} from "#/features/members/members.functions";
import type { WalletProvider } from "#/features/members/members.schemas";
import type {
	MemberPassView,
	PassInstallState,
	TransactionView,
	WalletState,
} from "#/features/members/members.server";
import type { WalletSyncResult } from "#/features/wallet-sync/wallet-sync";
import { FormAlert } from "@/components/form-alert";
import { FormattedDate } from "@/components/formatted-date";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
	"/_authed/programs/$programId/members/$memberId",
)({
	validateSearch: z.object({
		/** History page: changes older than this transaction ID. */
		before: z.int().positive().optional().catch(undefined),
	}),
	loaderDeps: ({ search }) => ({ before: search.before }),
	loader: async ({ params, deps }) => {
		const ids = z
			.object({ programId: z.uuid(), memberId: z.uuid() })
			.safeParse(params);
		if (!ids.success) {
			throw notFound();
		}
		const [member, history] = await Promise.all([
			getMember({ data: ids.data }),
			listTransactions({
				data: { memberId: ids.data.memberId, before: deps.before },
			}),
		]);
		return { member, history };
	},
	component: MemberPage,
	notFoundComponent: () => (
		<p className="text-muted-foreground">This member does not exist.</p>
	),
});

function MemberPage() {
	const { programId } = Route.useParams();
	const { member, history } = Route.useLoaderData();
	const router = useRouter();
	const adjustPointsFn = useServerFn(adjustPoints);
	/** The member whose wallet cards missed the last points change. */
	const [syncFailedFor, setSyncFailedFor] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-8">
			<div className="flex min-w-0 flex-col gap-1">
				<Link
					to="/programs/$programId"
					params={{ programId }}
					className="text-muted-foreground text-sm"
				>
					← Members
				</Link>
				<h2 className="truncate font-semibold text-xl">{member.name}</h2>
				<p className="truncate text-muted-foreground text-sm">
					{member.email} · Member since{" "}
					<FormattedDate value={member.createdAt} />
				</p>
			</div>

			<div className="grid items-start gap-3 md:grid-cols-2">
				<section className="flex flex-col gap-4 rounded-2xl border bg-surface p-4">
					<div>
						<div className="text-muted-foreground text-sm">Balance</div>
						<div className="font-semibold text-4xl tabular-nums">
							{member.points}{" "}
							<span className="font-normal text-base text-muted-foreground">
								points
							</span>
						</div>
					</div>
					{syncFailedFor === member.id ? (
						<SyncFailedNotice
							memberId={member.id}
							onRetried={(walletSync) =>
								setSyncFailedFor(walletSync === "failed" ? member.id : null)
							}
						/>
					) : null}
					<PointsForm
						balance={member.points}
						onSubmit={async ({ points, direction }) => {
							setSyncFailedFor(null);
							const result = await adjustPointsFn({
								data: { memberId: member.id, points, direction },
							});
							await router.invalidate({ sync: true });
							setSyncFailedFor(
								result.walletSync === "failed" ? member.id : null,
							);
							toast.add({
								type: "success",
								title: `${direction === "add" ? "Added" : "Redeemed"} ${points} points.`,
								description: `New balance: ${result.points}.`,
							});
						}}
					/>
				</section>
				<WalletCards wallets={member.wallets} passes={member.passes} />
			</div>

			<section className="flex flex-col gap-3">
				<h3 className="font-semibold">History</h3>
				<History
					programId={programId}
					memberId={member.id}
					passes={member.passes}
					transactions={history.transactions}
					nextBefore={history.nextBefore}
					until={history.until}
				/>
			</section>
		</div>
	);
}

const STATE_PILL_CLASSES: Record<PassInstallState, string> = {
	installed: "bg-success/10 text-success",
	removed: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	"not-added": "bg-background text-muted-foreground",
};

/** When the wallet reached its current state, from its passes. */
function stateDate(
	wallet: WalletState,
	passes: MemberPassView[],
): string | null {
	const dates = passes
		.filter(
			(pass) =>
				pass.provider === wallet.provider && pass.state === wallet.state,
		)
		.map((pass) =>
			wallet.state === "installed"
				? pass.installedAt
				: wallet.state === "removed"
					? pass.removedAt
					: pass.issuedAt,
		)
		.filter((date): date is string => date !== null);
	return dates.sort().at(-1) ?? null;
}

/** Whether the member's card is in each wallet: the state the cashier checks. */
function WalletCards({
	wallets,
	passes,
}: {
	wallets: WalletState[];
	passes: MemberPassView[];
}) {
	return (
		<section className="flex flex-col gap-3 rounded-2xl border bg-surface p-4">
			<h3 className="text-muted-foreground text-sm">Wallet card</h3>
			{wallets.length === 0 ? (
				<p className="text-muted-foreground text-sm">No card issued yet.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{wallets.map((wallet) => {
						const date = stateDate(wallet, passes);
						return (
							<li
								key={wallet.provider}
								className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5"
							>
								<span
									aria-hidden
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface"
								>
									<RiWallet3Line className="size-4" />
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium text-sm">
										{WALLET_NAMES[wallet.provider]}
									</span>
									{date ? (
										<span className="text-muted-foreground text-xs">
											{wallet.state === "not-added" ? "Issued " : "Since "}
											<FormattedDate value={date} />
										</span>
									) : null}
								</span>
								<span
									className={cn(
										"shrink-0 rounded-full px-2.5 py-0.5 font-medium text-xs",
										STATE_PILL_CLASSES[wallet.state],
									)}
								>
									{INSTALL_STATE_LABELS[wallet.state]}
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

/** Points saved, but the member's wallet cards could not be updated. */
function SyncFailedNotice({
	memberId,
	onRetried,
}: {
	memberId: string;
	onRetried: (walletSync: WalletSyncResult) => void;
}) {
	const retryFn = useServerFn(retryWalletSync);
	const [pending, setPending] = useState(false);

	async function retry() {
		setPending(true);
		try {
			const { walletSync } = await retryFn({ data: { memberId } });
			if (walletSync !== "failed") {
				toast.add({ type: "success", title: "Cards updated." });
			}
			onRetried(walletSync);
		} catch {
			onRetried("failed");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex flex-col items-start gap-2">
			<FormAlert>
				Points saved, but the member's wallet cards could not be updated: they
				may still show the previous balance.
			</FormAlert>
			<Button variant="outline" size="sm" disabled={pending} onClick={retry}>
				{pending ? "Updating…" : "Update the cards again"}
			</Button>
		</div>
	);
}

type HistoryEntry =
	| { kind: "transaction"; at: string; transaction: TransactionView }
	| {
			kind: "pass";
			at: string;
			event: "issued" | "installed" | "removed";
			provider: WalletProvider;
			key: string;
	  };

/** What happened to the member's wallet cards, as history entries. */
function passEntries(passes: MemberPassView[]): HistoryEntry[] {
	return passes.flatMap((pass) => {
		const events = [
			{ event: "issued", at: pass.issuedAt },
			{ event: "installed", at: pass.installedAt },
			{ event: "removed", at: pass.removedAt },
		] as const;
		return events.flatMap(({ event, at }) =>
			at
				? [
						{
							kind: "pass" as const,
							at,
							event,
							provider: pass.provider,
							key: `${pass.id}-${event}`,
						},
					]
				: [],
		);
	});
}

/**
 * The page's point changes, with the card events from the same period: from
 * its oldest change (or the beginning, on the last page) up to `until`.
 */
function historyEntries(
	passes: MemberPassView[],
	transactions: TransactionView[],
	nextBefore: number | null,
	until: string | null,
): HistoryEntry[] {
	const oldest = transactions.at(-1)?.createdAt;
	const from = nextBefore && oldest ? Date.parse(oldest) : -Infinity;
	const to = until ? Date.parse(until) : Infinity;
	const cardEvents = passEntries(passes).filter((entry) => {
		const at = Date.parse(entry.at);
		return at >= from && at < to;
	});
	return [
		...transactions.map((transaction) => ({
			kind: "transaction" as const,
			at: transaction.createdAt,
			transaction,
		})),
		...cardEvents,
	].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

interface EntryLook {
	label: string;
	icon: RemixiconComponentType;
	/** Classes of the round icon badge. */
	tint: string;
}

function entryLook(entry: HistoryEntry): EntryLook {
	if (entry.kind === "pass") {
		const wallet = WALLET_NAMES[entry.provider];
		switch (entry.event) {
			case "issued":
				return {
					label: `${wallet} card issued`,
					icon: RiBankCardLine,
					tint: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
				};
			case "installed":
				return {
					label: `Added to ${wallet}`,
					icon: RiWallet3Line,
					tint: "bg-success/15 text-success",
				};
			case "removed":
				return {
					label: `Removed from ${wallet}`,
					icon: RiDeleteBin6Line,
					tint: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
				};
		}
	}
	if (entry.transaction.kind === "welcome") {
		return {
			label: "Welcome points",
			icon: RiSparkling2Line,
			tint: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
		};
	}
	return entry.transaction.delta > 0
		? {
				label: "Points added",
				icon: RiAddLine,
				tint: "bg-success/15 text-success",
			}
		: {
				label: "Points redeemed",
				icon: RiGift2Line,
				tint: "bg-destructive/10 text-destructive",
			};
}

function History({
	programId,
	memberId,
	passes,
	transactions,
	nextBefore,
	until,
}: {
	programId: string;
	memberId: string;
	passes: MemberPassView[];
	transactions: TransactionView[];
	nextBefore: number | null;
	until: string | null;
}) {
	const { before } = Route.useSearch();
	const entries = historyEntries(passes, transactions, nextBefore, until);

	if (entries.length === 0) {
		return <p className="text-muted-foreground text-sm">No activity yet.</p>;
	}

	return (
		<div className="flex flex-col gap-3">
			<ul className="divide-y overflow-hidden rounded-2xl border bg-surface">
				{entries.map((entry) => (
					<HistoryRow
						key={
							entry.kind === "pass" ? entry.key : `t-${entry.transaction.id}`
						}
						entry={entry}
					/>
				))}
			</ul>
			{before || nextBefore ? (
				<nav className="flex justify-between gap-2" aria-label="History pages">
					{before ? (
						<Link
							to="/programs/$programId/members/$memberId"
							params={{ programId, memberId }}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Latest changes
						</Link>
					) : (
						<span />
					)}
					{nextBefore ? (
						<Link
							to="/programs/$programId/members/$memberId"
							params={{ programId, memberId }}
							search={{ before: nextBefore }}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Older changes
						</Link>
					) : null}
				</nav>
			) : null}
		</div>
	);
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
	const { label, icon: Icon, tint } = entryLook(entry);
	const transaction = entry.kind === "transaction" ? entry.transaction : null;

	return (
		<li className="flex items-center gap-3 px-4 py-3 text-sm">
			<span
				aria-hidden
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-full",
					tint,
				)}
			>
				<Icon className="size-4" />
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate font-medium">{label}</span>
				<span className="text-muted-foreground text-xs">
					<FormattedDate value={entry.at} withTime />
				</span>
			</span>
			{transaction ? (
				<span className="flex flex-col items-end tabular-nums">
					<span
						className={cn(
							"rounded-full px-2 py-0.5 font-semibold",
							transaction.delta > 0
								? "bg-success/10 text-success"
								: "bg-destructive/10 text-destructive",
						)}
					>
						{transaction.delta > 0
							? `+${transaction.delta}`
							: `−${-transaction.delta}`}
					</span>
					<span className="mt-0.5 text-muted-foreground text-xs">
						Balance {transaction.balanceAfter}
					</span>
				</span>
			) : null}
		</li>
	);
}
