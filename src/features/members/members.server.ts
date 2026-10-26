import {
	toMemberCursor,
	WALLET_PROVIDERS,
	type WalletProvider,
} from "#/features/members/members.schemas";
import type { Database, Tables } from "#/lib/supabase/database.types";

/** What the merchant's pages receive about members, their passes and balances. */

export const MEMBERS_PAGE_SIZE = 25;
export const TRANSACTIONS_PAGE_SIZE = 20;

/**
 * Whether the pass is in a wallet: `installed`, `removed` from every wallet
 * that held it, or `not-added` yet (its link was not used).
 */
export type PassInstallState = "installed" | "removed" | "not-added";

type PassRow = Pick<
	Tables<"wallet_passes">,
	"provider" | "installed_at" | "uninstalled_at"
>;

function passInstallState(pass: PassRow): PassInstallState {
	if (!pass.installed_at) {
		return "not-added";
	}
	return pass.uninstalled_at ? "removed" : "installed";
}

const INSTALL_STATE_RANK: Record<PassInstallState, number> = {
	installed: 2,
	removed: 1,
	"not-added": 0,
};

export interface WalletState {
	provider: WalletProvider;
	state: PassInstallState;
}

/** For each wallet the member has passes in, the best state among them. */
function walletStates(passes: PassRow[]): WalletState[] {
	return WALLET_PROVIDERS.flatMap((provider) => {
		const states = passes
			.filter((pass) => pass.provider === provider)
			.map(passInstallState);
		if (states.length === 0) {
			return [];
		}
		const state = states.reduce((best, current) =>
			INSTALL_STATE_RANK[current] > INSTALL_STATE_RANK[best] ? current : best,
		);
		return [{ provider, state }];
	});
}

type MemberRow = Pick<
	Tables<"members">,
	| "id"
	| "first_name"
	| "last_name"
	| "email"
	| "points"
	| "stamps"
	| "stamp_rewards"
	| "created_at"
>;

export const MEMBER_LIST_COLUMNS =
	"id, first_name, last_name, email, points, stamps, stamp_rewards, created_at, wallet_passes(provider, installed_at, uninstalled_at)" as const;

export interface MemberListItem {
	id: string;
	name: string;
	email: string;
	/** Only the balance of the program's kind means something. */
	points: number;
	stamps: number;
	/** Full stamp cards exchanged for the reward. */
	stampRewards: number;
	createdAt: string;
	wallets: WalletState[];
}

export function toMemberListItem(
	row: MemberRow & { wallet_passes: PassRow[] },
): MemberListItem {
	return {
		id: row.id,
		name: `${row.first_name} ${row.last_name}`,
		email: row.email,
		points: row.points,
		stamps: row.stamps,
		stampRewards: row.stamp_rewards,
		createdAt: row.created_at,
		wallets: walletStates(row.wallet_passes),
	};
}

/** The next page's cursor, when `rows` has one more member than a page. */
export function nextMemberCursor(rows: MemberRow[]): string | null {
	const last = rows[MEMBERS_PAGE_SIZE - 1];
	return rows.length > MEMBERS_PAGE_SIZE && last
		? toMemberCursor({ createdAt: last.created_at, id: last.id })
		: null;
}

export const MEMBER_COLUMNS =
	"id, first_name, last_name, email, points, stamps, stamp_rewards, created_at, wallet_passes(id, provider, created_at, installed_at, uninstalled_at)" as const;

export interface MemberPassView {
	id: string;
	provider: WalletProvider;
	state: PassInstallState;
	issuedAt: string;
	/** When the pass was added to a wallet. */
	installedAt: string | null;
	/** When the pass was removed from every wallet that held it. */
	removedAt: string | null;
}

export interface MemberView {
	id: string;
	name: string;
	email: string;
	points: number;
	stamps: number;
	stampRewards: number;
	createdAt: string;
	passes: MemberPassView[];
	/** One state per wallet, as in the member list. */
	wallets: WalletState[];
}

export function toMemberView(
	row: MemberRow & {
		wallet_passes: (PassRow &
			Pick<Tables<"wallet_passes">, "id" | "created_at">)[];
	},
): MemberView {
	return {
		id: row.id,
		name: `${row.first_name} ${row.last_name}`,
		email: row.email,
		points: row.points,
		stamps: row.stamps,
		stampRewards: row.stamp_rewards,
		createdAt: row.created_at,
		passes: row.wallet_passes.map((pass) => ({
			id: pass.id,
			provider: pass.provider,
			state: passInstallState(pass),
			issuedAt: pass.created_at,
			installedAt: pass.installed_at,
			removedAt: pass.uninstalled_at,
		})),
		wallets: walletStates(row.wallet_passes),
	};
}

export const TRANSACTION_COLUMNS =
	"id, kind, delta, balance_after, created_at" as const;

type TransactionRow = Pick<
	Tables<"point_transactions"> | Tables<"stamp_transactions">,
	"id" | "kind" | "delta" | "balance_after" | "created_at"
>;

export interface TransactionView {
	id: number;
	kind: TransactionRow["kind"];
	delta: number;
	balanceAfter: number;
	createdAt: string;
}

export function toTransactionView(row: TransactionRow): TransactionView {
	return {
		id: row.id,
		kind: row.kind,
		delta: row.delta,
		balanceAfter: row.balance_after,
		createdAt: row.created_at,
	};
}

type ProgramStatsRow =
	Database["public"]["Functions"]["program_stats"]["Returns"][number];

export interface ProgramStats {
	members: number;
	/** Members who joined in the last 30 days. */
	newMembers: number;
	/** Members with at least one pass installed in a wallet. */
	membersInWallet: number;
	/**
	 * Point or stamp additions in the last 30 days: roughly, rewarded visits.
	 */
	pointAdditions: number;
	/** Point redemptions, or full stamp cards exchanged, in the last 30 days. */
	redemptions: number;
}

export function toProgramStats(row: ProgramStatsRow): ProgramStats {
	return {
		members: row.members,
		newMembers: row.new_members,
		membersInWallet: row.members_in_wallet,
		pointAdditions: row.point_additions,
		redemptions: row.redemptions,
	};
}

type ProgramVisitsRow =
	Database["public"]["Functions"]["program_visits"]["Returns"][number];

/** Visits of one UTC hour: the browser groups them into local days. */
export interface HourlyVisits {
	hour: string;
	visits: number;
}

export function toHourlyVisits(row: ProgramVisitsRow): HourlyVisits {
	return { hour: row.hour, visits: row.visits };
}
