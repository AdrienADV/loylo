import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "#/features/auth/auth.middleware";
import {
	memberIdSchema,
	memberListSchema,
	passScanSchema,
	pointsChangeSchema,
	programMemberPassSchema,
	programMemberSchema,
	stampsChangeSchema,
	transactionListSchema,
} from "#/features/members/members.schemas";
import {
	MEMBER_COLUMNS,
	MEMBER_LIST_COLUMNS,
	MEMBERS_PAGE_SIZE,
	nextMemberCursor,
	TRANSACTION_COLUMNS,
	TRANSACTIONS_PAGE_SIZE,
	toHourlyVisits,
	toMemberListItem,
	toMemberView,
	toProgramStats,
	toTransactionView,
} from "#/features/members/members.server";
import {
	getAvailableWallets,
	passLinkPath,
} from "#/features/members/wallet-passes.server";
import { programIdSchema } from "#/features/programs/programs.schemas";
import { syncMemberWallets } from "#/features/wallet-sync/wallet-sync.server";
import { databaseError, isCheckViolation } from "#/lib/supabase/errors.server";

/**
 * Row Level Security limits every query to the signed-in merchant's members:
 * another merchant's member ID behaves like a missing one.
 */

/** Wallets the merchant can issue passes for. */
export const listAvailableWallets = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(() => getAvailableWallets());

/**
 * Issues a pass for a customer, from the merchant's side. A customer already
 * enrolled with this email gets a new pass that keeps their points (new phone,
 * other wallet). RLS limits it to the merchant's programs.
 */
export const issuePass = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(programMemberPassSchema)
	.handler(async ({ data, context }) => {
		if (!getAvailableWallets()[data.provider]) {
			throw new Error("This wallet is not available.");
		}

		const { data: pass, error } = await context.supabase
			.rpc("issue_wallet_pass", {
				program_id: data.programId,
				email: data.email,
				first_name: data.firstName,
				last_name: data.lastName,
				provider: data.provider,
			})
			.maybeSingle();
		if (error) {
			throw databaseError("issue the card", error);
		}
		if (!pass) {
			throw notFound();
		}

		return {
			passLink: passLinkPath({
				provider: data.provider,
				serialNumber: pass.serial_number,
				authenticationToken: pass.authentication_token,
			}),
			memberCreated: pass.member_created,
		};
	});

/**
 * A page of the program's members, newest first, with the install state of
 * their passes. `after` is the previous page's `nextCursor`.
 */
export const listMembers = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(memberListSchema)
	.handler(async ({ data, context }) => {
		const { data: rows, error } = await context.supabase
			.rpc("list_members", {
				program_id: data.programId,
				search: data.search,
				after_created_at: data.after?.createdAt,
				after_id: data.after?.id,
				// One more than a page tells whether another page follows.
				page_size: MEMBERS_PAGE_SIZE + 1,
			})
			.select(MEMBER_LIST_COLUMNS)
			.order("created_at", { ascending: false })
			.order("id", { ascending: false });
		if (error) {
			throw databaseError("load the members", error);
		}

		return {
			members: rows.slice(0, MEMBERS_PAGE_SIZE).map(toMemberListItem),
			nextCursor: nextMemberCursor(rows),
		};
	});

/**
 * Headline numbers of the program: members, members keeping the card in a
 * wallet, and the last 30 days' activity.
 */
export const getProgramStats = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.rpc("program_stats", { program_id: data.programId })
			.single();
		if (error) {
			throw databaseError("load the statistics", error);
		}
		return toProgramStats(row);
	});

/**
 * Visits of the program hour by hour over the last 31 days: enough for 30
 * full days in any time zone.
 */
export const getProgramVisits = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		const { data: rows, error } = await context.supabase.rpc("program_visits", {
			program_id: data.programId,
			days: 31,
		});
		if (error) {
			throw databaseError("load the visits", error);
		}
		return rows.map(toHourlyVisits);
	});

export const getMember = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(programMemberSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.from("members")
			.select(MEMBER_COLUMNS)
			.eq("id", data.memberId)
			.eq("program_id", data.programId)
			.order("created_at", {
				referencedTable: "wallet_passes",
				ascending: false,
			})
			.maybeSingle();
		if (error) {
			throw databaseError("load the member", error);
		}
		if (!row) {
			throw notFound();
		}
		return toMemberView(row);
	});

/**
 * The member holding the scanned pass, if it belongs to this program. The
 * QR code of a pass is its serial number.
 */
export const findMemberBySerial = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(passScanSchema)
	.handler(async ({ data, context }) => {
		const { data: pass, error } = await context.supabase
			.from("wallet_passes")
			.select("member_id, member:members!inner(program_id)")
			.eq("serial_number", data.serialNumber)
			.eq("member.program_id", data.programId)
			.maybeSingle();
		if (error) {
			throw databaseError("find this card", error);
		}
		return { memberId: pass?.member_id ?? null };
	});

/**
 * Adds or redeems points, then brings the member's passes up to date in
 * their wallets. The change is saved even when a wallet cannot be reached:
 * `walletSync` says so, and `retryWalletSync` tries again.
 */
export const adjustPoints = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(pointsChangeSchema)
	.handler(async ({ data, context }) => {
		const { data: points, error } = await context.supabase.rpc(
			"adjust_points",
			{
				member_id: data.memberId,
				delta: data.direction === "add" ? data.points : -data.points,
			},
		);
		if (error) {
			if (isCheckViolation(error, "members_points_check")) {
				throw new Error("This member does not have enough points.");
			}
			if (error.code === "LY003") {
				throw new Error("This program collects stamps, not points.");
			}
			throw databaseError("update the points", error);
		}
		// The function returns null when RLS hides the member.
		if (points === null) {
			throw notFound();
		}

		return {
			points,
			walletSync:
				(await syncMemberWallets(context.supabase, data.memberId)) ?? "skipped",
		};
	});

/**
 * Adds stamps, or removes stamps given by mistake, then brings the member's
 * passes up to date. Adding to a full card gives the reward and starts a new
 * card: `rewardGiven` says so.
 */
export const addStamps = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(stampsChangeSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.rpc("add_stamps", {
				member_id: data.memberId,
				count: data.direction === "add" ? data.stamps : -data.stamps,
			})
			.maybeSingle();
		if (error) {
			if (isCheckViolation(error, "members_stamps_check")) {
				throw new Error("This member does not have that many stamps.");
			}
			if (error.code === "LY003") {
				throw new Error("This program counts points, not stamps.");
			}
			if (error.code === "LY004") {
				throw new Error(
					"That many stamps do not fit on the card. Fill it first: the next stamps start a new card.",
				);
			}
			throw databaseError("update the stamps", error);
		}
		// No row when RLS hides the member.
		if (!row) {
			throw notFound();
		}

		return {
			stamps: row.stamps,
			rewardGiven: row.reward_given,
			walletSync:
				(await syncMemberWallets(context.supabase, data.memberId)) ?? "skipped",
		};
	});

/** Sends the member's current points or stamps to their wallets again. */
export const retryWalletSync = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(memberIdSchema)
	.handler(async ({ data, context }) => {
		const walletSync = await syncMemberWallets(context.supabase, data.memberId);
		if (!walletSync) {
			throw notFound();
		}
		return { walletSync };
	});

/** The member's point or stamp changes, newest first, a page at a time. */
export const listTransactions = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(transactionListSchema)
	.handler(async ({ data, context }) => {
		// Including the `before` transaction gives the date this page ends at.
		let query = context.supabase
			.from(
				data.ledger === "stamps" ? "stamp_transactions" : "point_transactions",
			)
			.select(TRANSACTION_COLUMNS)
			.eq("member_id", data.memberId)
			.order("id", { ascending: false })
			.limit(TRANSACTIONS_PAGE_SIZE + (data.before ? 2 : 1));
		if (data.before) {
			query = query.lte("id", data.before);
		}
		const { data: allRows, error } = await query;
		if (error) {
			throw databaseError(`load the ${data.ledger} history`, error);
		}

		const newer = allRows[0]?.id === data.before ? allRows[0] : undefined;
		const rows = newer ? allRows.slice(1) : allRows;
		const transactions = rows.slice(0, TRANSACTIONS_PAGE_SIZE);
		return {
			transactions: transactions.map(toTransactionView),
			/** Events after this date belong to newer pages; null on the first. */
			until: newer?.created_at ?? null,
			nextBefore:
				rows.length > TRANSACTIONS_PAGE_SIZE
					? (transactions.at(-1)?.id ?? null)
					: null,
		};
	});
