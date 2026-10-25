import { z } from "zod";

/** What a pass shows of the member's balance: points, or stamps on a card. */
export const passBalanceSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("points"), points: z.int().nonnegative() }),
	z.object({
		kind: z.literal("stamps"),
		stamps: z.int().nonnegative(),
		cardSize: z.int().positive(),
	}),
]);

export type PassBalance = z.input<typeof passBalanceSchema>;

/** "7/10". */
export function formatStampBalance(stamps: number, cardSize: number): string {
	return `${stamps}/${cardSize}`;
}
