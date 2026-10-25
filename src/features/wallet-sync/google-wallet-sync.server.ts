import type { SupabaseClient } from "@supabase/supabase-js";

import { toPassBalance } from "#/features/members/pass-balance";
import {
	stampImageUrl,
	syncGoogleLoyaltyClass,
} from "#/features/programs/programs.server";
import {
	combineSyncResults,
	type MemberPasses,
	type ProgramToSync,
	type WalletSync,
	type WalletSyncResult,
} from "#/features/wallet-sync/wallet-sync";
import {
	type GoogleWalletConfig,
	getOptionalGoogleWalletConfig,
} from "#/lib/config.server";
import type { Database } from "#/lib/supabase/database.types";
import {
	createGoogleWalletClient,
	GoogleWalletApiError,
} from "#/lib/wallet/google/client.server";
import {
	buildLoyaltyBalance,
	buildProgramMessage,
	toGoogleWalletId,
} from "#/lib/wallet/google/objects";

/**
 * Google Wallet: passes show their object and its class, so updating them
 * updates the passes on every device. Object IDs are `{issuer}.{wallet pass
 * id}`, class IDs `{issuer}.{program id}`.
 */

type Supabase = SupabaseClient<Database>;

/** The Data API returns at most this many rows per request (`max_rows`). */
const PASSES_PAGE_SIZE = 1000;

/** Sends the balance to each object; objects not created yet are skipped. */
async function setObjectBalances(
	config: GoogleWalletConfig,
	passes: MemberPasses[],
): Promise<WalletSyncResult> {
	const client = createGoogleWalletClient(config.serviceAccount);
	const results = await Promise.all(
		passes.flatMap(({ balance, stampImageUrl, passIds }) =>
			passIds.map(async (passId): Promise<WalletSyncResult> => {
				try {
					await client.setLoyaltyBalance(
						toGoogleWalletId(config.issuerId, passId),
						buildLoyaltyBalance(balance, stampImageUrl),
					);
					return "synced";
				} catch (error) {
					// The object is created, with the current balance, when the
					// pass link is first opened: until then there is nothing to update.
					if (error instanceof GoogleWalletApiError && error.status === 404) {
						return "skipped";
					}
					console.error("Google Wallet balance update failed", passId, error);
					return "failed";
				}
			}),
		),
	);
	return combineSyncResults(results);
}

/**
 * The program's Google passes with their member's stamps, a page at a time,
 * or `null` when they cannot be read.
 */
async function listStampPasses(
	supabase: Supabase,
	program: ProgramToSync,
): Promise<MemberPasses[] | null> {
	const folder = program.stamp_images_path;
	const passes: MemberPasses[] = [];
	for (let from = 0; ; from += PASSES_PAGE_SIZE) {
		const { data, error } = await supabase
			.from("wallet_passes")
			.select("id, member:members!inner(points, stamps, program_id)")
			.eq("provider", "google")
			.eq("member.program_id", program.id)
			.order("id")
			.range(from, from + PASSES_PAGE_SIZE - 1);
		if (error) {
			console.error(
				"Could not load the program's Google passes",
				error.code,
				error.message,
			);
			return null;
		}
		for (const pass of data) {
			passes.push({
				balance: toPassBalance(program, pass.member),
				stampImageUrl: folder
					? stampImageUrl(supabase, folder, pass.member.stamps)
					: null,
				passIds: [pass.id],
			});
		}
		if (data.length < PASSES_PAGE_SIZE) {
			return passes;
		}
	}
}

export const googleWalletSync: WalletSync = {
	async syncMemberPasses(passes) {
		const config = getOptionalGoogleWalletConfig();
		if (!config) {
			return "skipped";
		}
		return setObjectBalances(config, [passes]);
	},

	/**
	 * The class carries the program's design and message. A stamp card's image
	 * is on each object: a new design (new image URLs) updates them all, one
	 * request per pass, like the Apple pushes.
	 */
	async syncProgramPasses(supabase, program) {
		const classSync = await syncGoogleLoyaltyClass(supabase, program);
		const config = getOptionalGoogleWalletConfig();
		if (!config || program.kind !== "stamps") {
			return classSync;
		}
		const passes = await listStampPasses(supabase, program);
		if (!passes) {
			return "failed";
		}
		return combineSyncResults([
			classSync,
			await setObjectBalances(config, passes),
		]);
	},

	async sendProgramMessage(supabase, program) {
		const config = getOptionalGoogleWalletConfig();
		if (!config || !program.wallet_message) {
			return "skipped";
		}

		// Google's documented way to notify holders: `addMessage` with
		// `TEXT_AND_NOTIFY`. Class updates only carry `TEXT` messages.
		try {
			await createGoogleWalletClient(
				config.serviceAccount,
			).addLoyaltyClassMessage(
				toGoogleWalletId(config.issuerId, program.id),
				buildProgramMessage(
					program.name,
					program.wallet_message,
					"TEXT_AND_NOTIFY",
				),
			);
		} catch (error) {
			// Without a class, no pass exists yet: the sync below creates it.
			if (!(error instanceof GoogleWalletApiError && error.status === 404)) {
				console.error("Google Wallet message failed", program.id, error);
				return "failed";
			}
		}
		// Replaces the class, which keeps the new message as its only one.
		return syncGoogleLoyaltyClass(supabase, program);
	},
};
