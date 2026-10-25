import { z } from "zod";

import {
	MAX_INITIAL_STAMPS,
	stampIconSchema,
} from "#/features/programs/stamp-card";
import { hexColorSchema } from "#/lib/colors";

export const PROGRAM_KINDS = ["points", "stamps"] as const;

export type ProgramKind = (typeof PROGRAM_KINDS)[number];

const programDesignSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Enter the name of your business.")
		.max(64, "Use at most 64 characters."),
	backgroundColor: hexColorSchema,
});

/**
 * Editable fields of a program, shared by the form and the server functions.
 * Each kind has its own fields; the kind itself is only chosen on creation.
 */
export const programFieldsSchema = z.discriminatedUnion(
	"kind",
	[
		programDesignSchema.extend({
			kind: z.literal("points"),
			initialPoints: z.coerce
				.number({ error: "Enter a number." })
				.int("Enter a whole number.")
				.min(0, "Points cannot be negative.")
				.max(1_000_000, "Use at most 1,000,000 points."),
		}),
		programDesignSchema.extend({
			kind: z.literal("stamps"),
			initialStamps: z.coerce
				.number({ error: "Enter a number." })
				.int("Enter a whole number.")
				.min(0, "Stamps cannot be negative.")
				.max(
					MAX_INITIAL_STAMPS,
					`Use at most ${MAX_INITIAL_STAMPS} stamps: a new card is never full.`,
				),
			stampReward: z
				.string()
				.trim()
				.min(1, "Enter what a full card gives.")
				.max(40, "Use at most 40 characters."),
			stampIcon: stampIconSchema,
		}),
	],
	{ error: "Choose points or stamps." },
);

export type ProgramFields = z.output<typeof programFieldsSchema>;

/** Names of the program form's fields, as sent in its FormData. */
export const PROGRAM_FIELD_NAMES = [
	"name",
	"backgroundColor",
	"kind",
	"initialPoints",
	"initialStamps",
	"stampReward",
	"stampIcon",
] as const;

export const programIdSchema = z.object({ programId: z.uuid() });

/**
 * Images generated in the browser from the uploaded logo, stored in the
 * `program-assets` bucket. Apple Wallet uses the icon (notifications, lock
 * screen) and the logo (top of the pass); Google Wallet shows a square logo
 * in a circle and recommends 660×660 px.
 */
export const PROGRAM_IMAGES = {
	"apple-icon.png": { width: 29, height: 29, fit: "square" },
	"apple-icon@2x.png": { width: 58, height: 58, fit: "square" },
	// Wallet allows 160×50 points; a lower logo leaves room above and below.
	"apple-logo.png": { width: 160, height: 40, fit: "within" },
	"apple-logo@2x.png": { width: 320, height: 80, fit: "within" },
	"google-logo.png": { width: 660, height: 660, fit: "square" },
} as const;

export type ProgramImageName = keyof typeof PROGRAM_IMAGES;

export const PROGRAM_IMAGE_NAMES = Object.keys(
	PROGRAM_IMAGES,
) as ProgramImageName[];

/** The `program-assets` bucket only accepts PNG files up to 1 MB. */
export const MAX_PROGRAM_IMAGE_BYTES = 1024 * 1024;
