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
	Await,
	createFileRoute,
	getRouteApi,
	Link,
	notFound,
	useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import {
	PointsForm,
	PointsFormSkeleton,
} from "#/features/members/components/points-form";
import { StampsForm } from "#/features/members/components/stamps-form";
import { WALLET_NAMES } from "#/features/members/components/wallet-state-badge";
import {
	addStamps,
	adjustPoints,
	getMember,
	listTransactions,
	retryWalletSync,
} from "#/features/members/members.functions";
import type {
	Ledger,
	WalletProvider,
} from "#/features/members/members.schemas";
import type {
	MemberPassView,
	MemberView,
	TransactionView,
	WalletState,
} from "#/features/members/members.server";
import type { TeamProgramView } from "#/features/programs/programs.server";
import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";
import type { WalletSyncResult } from "#/features/wallet-sync/wallet-sync";
import { formatStampBalance } from "#/lib/wallet/balance";
import { FormAlert } from "@/components/form-alert";
import { FormattedDate } from "@/components/formatted-date";
import { SkeletonText } from "@/components/skeletons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const programRoute = getRouteApi("/_authed/programs/$programId");

export const Route = createFileRoute(
	"/_authed/programs/$programId/members/$memberId",
)({
	validateSearch: z.object({
		/** History page: changes older than this transaction ID. */
		before: z.int().positive().optional().catch(undefined),
	}),
	loaderDeps: ({ search }) => ({ before: search.before }),
	// Not awaited: the page shows at once, with skeletons until the data comes.
	loader: ({ params, deps, parentMatchPromise }) => {
		const ids = z
			.object({ programId: z.uuid(), memberId: z.uuid() })
			.safeParse(params);
		if (!ids.success) {
			throw notFound();
		}
		const member = getMember({ data: ids.data });
		// Points and stamps have their own history: the program tells which.
		const transactions = parentMatchPromise.then(({ loaderData: program }) =>
			listTransactions({
				data: {
					memberId: ids.data.memberId,
					ledger: program?.kind ?? "points",
					before: deps.before,
				},
			}),
		);
		return {
			member,
			// The history mixes in the card events, which come with the member.
			history: Promise.all([member, transactions]).then(
				([{ passes }, page]) => ({ passes, ...page }),
			),
		};
	},
	component: MemberPage,
	notFoundComponent: () => (
		<p className="text-muted-foreground">This member does not exist.</p>
	),
});

function MemberPage() {
	const program = programRoute.useLoaderData();
	const { programId, memberId } = Route.useParams();
	const { member, history } = Route.useLoaderData();

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
				<Await
					promise={member}
					fallback={
						<>
							<SkeletonText className="w-48 text-xl" />
							<SkeletonText className="w-80 max-w-full text-sm" />
						</>
					}
				>
					{(member) => (
						<>
							<h2 className="truncate font-semibold text-xl">{member.name}</h2>
							<p className="truncate text-muted-foreground text-sm">
								{member.email} · Member since{" "}
								<FormattedDate value={member.createdAt} />
							</p>
						</>
					)}
				</Await>
			</div>

			<Await promise={member} fallback={<BalanceSkeleton />}>
				{(member) =>
					program.kind === "stamps" ? (
						<StampsBalance program={program} member={member} />
					) : (
						<Balance member={member} />
					)
				}
			</Await>

			<section className="flex flex-col gap-3">
				<h3 className="font-semibold">History</h3>
				<Await promise={history} fallback={<HistorySkeleton />}>
					{(history) => (
						<History
							programId={programId}
							memberId={memberId}
							passes={history.passes}
							transactions={history.transactions}
							nextBefore={history.nextBefore}
							until={history.until}
						/>
					)}
				</Await>
			</section>
		</div>
	);
}

function Balance({ member }: { member: MemberView }) {
	const router = useRouter();
	const adjustPointsFn = useServerFn(adjustPoints);
	/** The member whose wallet cards missed the last points change. */
	const [syncFailedFor, setSyncFailedFor] = useState<string | null>(null);

	return (
		<section className="flex max-w-md flex-col gap-4 rounded-2xl border bg-surface p-4">
			<div>
				<div className="flex items-center justify-between gap-2">
					<span className="text-muted-foreground text-sm">Balance</span>
					<WalletStatus wallets={member.wallets} />
				</div>
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
					setSyncFailedFor(result.walletSync === "failed" ? member.id : null);
					toast.add({
						type: "success",
						title: `${direction === "add" ? "Added" : "Redeemed"} ${points} points.`,
						description: `New balance: ${result.points}.`,
					});
				}}
			/>
		</section>
	);
}

function StampsBalance({
	program,
	member,
}: {
	program: TeamProgramView;
	member: MemberView;
}) {
	const router = useRouter();
	const addStampsFn = useServerFn(addStamps);
	/** The member whose wallet cards missed the last stamps change. */
	const [syncFailedFor, setSyncFailedFor] = useState<string | null>(null);
	const full = member.stamps === STAMPS_PER_CARD;
	const cardImageUrl = program.stampImageUrls?.[member.stamps];

	return (
		<section className="flex max-w-md flex-col gap-4 rounded-2xl border bg-surface p-4">
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-2">
					<span className="text-muted-foreground text-sm">Stamp card</span>
					<WalletStatus wallets={member.wallets} />
				</div>
				{cardImageUrl ? (
					<img
						src={cardImageUrl}
						alt={`${member.stamps} of ${STAMPS_PER_CARD} stamps`}
						className="aspect-[1125/369] w-full rounded-xl"
						style={{ backgroundColor: program.backgroundColor }}
					/>
				) : null}
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<div className="font-semibold text-4xl tabular-nums">
						{formatStampBalance(member.stamps, STAMPS_PER_CARD)}{" "}
						<span className="font-normal text-base text-muted-foreground">
							stamps
						</span>
					</div>
					<span className="text-muted-foreground text-sm">
						{member.stampRewards}{" "}
						{member.stampRewards === 1 ? "reward" : "rewards"} given
					</span>
				</div>
				{full ? (
					<p className="rounded-xl bg-success/10 px-3 py-2 font-medium text-sm text-success">
						Card full: {program.stampReward ?? "the reward"} is ready. The next
						stamps give it and start a new card.
					</p>
				) : null}
			</div>
			{syncFailedFor === member.id ? (
				<SyncFailedNotice
					memberId={member.id}
					onRetried={(walletSync) =>
						setSyncFailedFor(walletSync === "failed" ? member.id : null)
					}
				/>
			) : null}
			<StampsForm
				stamps={member.stamps}
				onSubmit={async ({ stamps, direction }) => {
					setSyncFailedFor(null);
					const result = await addStampsFn({
						data: { memberId: member.id, stamps, direction },
					});
					await router.invalidate({ sync: true });
					setSyncFailedFor(result.walletSync === "failed" ? member.id : null);
					const card = formatStampBalance(result.stamps, STAMPS_PER_CARD);
					toast.add({
						type: "success",
						title: result.rewardGiven
							? "Reward given, new card started."
							: `${direction === "add" ? "Added" : "Removed"} ${stamps} ${stamps === 1 ? "stamp" : "stamps"}.`,
						description: `Card: ${card}.`,
					});
				}}
			/>
		</section>
	);
}

/** `Balance` while the member loads. */
function BalanceSkeleton() {
	return (
		<section
			aria-hidden
			className="flex max-w-md flex-col gap-4 rounded-2xl border bg-surface p-4"
		>
			<div>
				<div className="flex items-center justify-between gap-2">
					<span className="text-muted-foreground text-sm">Balance</span>
					<span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-foreground/[0.07] px-2.5 py-0.5 font-medium text-transparent text-xs">
						<span className="size-1.5" />
						Active
					</span>
				</div>
				<div className="font-semibold text-4xl">
					<SkeletonText className="w-40" />
				</div>
			</div>
			<PointsFormSkeleton />
		</section>
	);
}

/** "Active" while the member's card is in at least one wallet. */
function WalletStatus({ wallets }: { wallets: WalletState[] }) {
	const active = wallets.some((wallet) => wallet.state === "installed");
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-xs",
				active
					? "bg-success/10 text-success"
					: "bg-background text-muted-foreground",
			)}
		>
			<span
				aria-hidden
				className={cn(
					"size-1.5 rounded-full",
					active ? "bg-success" : "bg-muted-foreground/40",
				)}
			/>
			{active ? "Active" : "Inactive"}
		</span>
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
				Change saved, but the member's wallet cards could not be updated: they
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

function entryLook(entry: HistoryEntry, ledger: Ledger): EntryLook {
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
	switch (entry.transaction.kind) {
		case "welcome":
			return {
				label: `Welcome ${ledger}`,
				icon: RiSparkling2Line,
				tint: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
			};
		case "stamp":
			return {
				label: "Stamps added",
				icon: RiAddLine,
				tint: "bg-success/15 text-success",
			};
		case "reward":
			return {
				label: "Reward given",
				icon: RiGift2Line,
				tint: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
			};
	}
	if (ledger === "stamps") {
		return {
			label: "Stamps removed",
			icon: RiDeleteBin6Line,
			tint: "bg-destructive/10 text-destructive",
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
	const ledger = programRoute.useLoaderData().kind;
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
						ledger={ledger}
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

/** `History` while it loads. */
function HistorySkeleton() {
	return (
		<ul
			aria-hidden
			className="divide-y overflow-hidden rounded-2xl border bg-surface"
		>
			{Array.from({ length: 5 }, (_, index) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
					key={index}
					className="flex items-center gap-3 px-4 py-3 text-sm"
				>
					<Skeleton className="size-9 shrink-0 rounded-full" />
					<span className="flex min-w-0 flex-1 flex-col">
						<SkeletonText className="w-32" />
						<SkeletonText className="w-28 text-xs" />
					</span>
					<span className="flex flex-col items-end">
						<Skeleton className="h-6 w-12 rounded-full" />
						<SkeletonText className="mt-0.5 w-16 text-xs" />
					</span>
				</li>
			))}
		</ul>
	);
}

function HistoryRow({
	entry,
	ledger,
}: {
	entry: HistoryEntry;
	ledger: Ledger;
}) {
	const { label, icon: Icon, tint } = entryLook(entry, ledger);
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
						{ledger === "stamps"
							? `Card ${formatStampBalance(transaction.balanceAfter, STAMPS_PER_CARD)}`
							: `Balance ${transaction.balanceAfter}`}
					</span>
				</span>
			) : null}
		</li>
	);
}
