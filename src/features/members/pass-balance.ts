import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";
import type { Tables } from "#/lib/supabase/database.types";
import type { PassBalance } from "#/lib/wallet/balance";

/** What the member's passes show: their points, or their stamps. */
export function toPassBalance(
	program: Pick<Tables<"programs">, "kind">,
	member: Pick<Tables<"members">, "points" | "stamps">,
): PassBalance {
	return program.kind === "stamps"
		? { kind: "stamps", stamps: member.stamps, cardSize: STAMPS_PER_CARD }
		: { kind: "points", points: member.points };
}
