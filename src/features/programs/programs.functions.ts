import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "#/features/auth/auth.middleware";
import {
	PROGRAM_FIELD_NAMES,
	type ProgramFields,
	programFieldsSchema,
	programIdSchema,
} from "#/features/programs/programs.schemas";
import {
	newImageFolder,
	newStampImageFolder,
	PROGRAM_COLUMNS,
	readProgramImages,
	readStampImages,
	removeProgramImages,
	removeStampImages,
	syncGoogleLoyaltyClass,
	TEAM_PROGRAM_COLUMNS,
	toProgramView,
	toTeamProgramView,
	uploadProgramImages,
} from "#/features/programs/programs.server";
import { requireProgramAdmin } from "#/features/team/team.server";
import { PROGRAM_TO_SYNC_COLUMNS } from "#/features/wallet-sync/wallet-sync";
import { syncProgramWallets } from "#/features/wallet-sync/wallet-sync.server";
import { databaseError } from "#/lib/supabase/errors.server";

/**
 * Row Level Security limits every query to the programs whose team the
 * signed-in user is in, and changes to the programs they are an admin of:
 * another merchant's program ID behaves like a missing one.
 */

/** Program forms are sent as FormData: text fields plus the generated images. */
function parseProgramForm(data: unknown) {
	if (!(data instanceof FormData)) {
		throw new Error("Expected form data");
	}
	const fields = programFieldsSchema.parse(
		Object.fromEntries(
			PROGRAM_FIELD_NAMES.map((name) => [name, data.get(name) ?? undefined]),
		),
	);
	return { fields, formData: data };
}

/** The settings columns of the fields' kind; the other kind's stay empty. */
function kindColumns(fields: ProgramFields) {
	return fields.kind === "points"
		? {
				initial_points: fields.initialPoints,
				initial_stamps: 0,
				stamp_reward: null,
				stamp_icon: null,
			}
		: {
				initial_points: 0,
				initial_stamps: fields.initialStamps,
				stamp_reward: fields.stampReward,
				stamp_icon: fields.stampIcon,
			};
}

const MISSING_STAMP_IMAGES = "The stamp card images are missing. Save again.";

export const listPrograms = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const { data, error } = await context.supabase
			.from("programs")
			.select(TEAM_PROGRAM_COLUMNS)
			.eq("program_members.user_id", context.userId)
			.order("created_at", { ascending: false });
		if (error) {
			throw databaseError("load your programs", error);
		}
		return data.map((row) => toTeamProgramView(context.supabase, row));
	});

export const getProgram = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.from("programs")
			.select(TEAM_PROGRAM_COLUMNS)
			.eq("id", data.programId)
			.eq("program_members.user_id", context.userId)
			.maybeSingle();
		if (error) {
			throw databaseError("load the program", error);
		}
		if (!row) {
			throw notFound();
		}
		return toTeamProgramView(context.supabase, row);
	});

export const createProgram = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(parseProgramForm)
	.handler(async ({ data: { fields, formData }, context }) => {
		const images = await readProgramImages(formData);
		if (!images) {
			throw new Error("Add a logo.");
		}
		const stampImages =
			fields.kind === "stamps" ? await readStampImages(formData) : null;
		if (fields.kind === "stamps" && !stampImages) {
			throw new Error(MISSING_STAMP_IMAGES);
		}

		const programId = crypto.randomUUID();
		const folder = newImageFolder(context.userId, programId);
		const stampFolder = stampImages
			? newStampImageFolder(context.userId, programId)
			: null;
		await Promise.all([
			uploadProgramImages(context.supabase, folder, images),
			stampImages && stampFolder
				? uploadProgramImages(context.supabase, stampFolder, stampImages)
				: null,
		]);

		const { data: row, error } = await context.supabase
			.from("programs")
			.insert({
				id: programId,
				name: fields.name,
				background_color: fields.backgroundColor,
				kind: fields.kind,
				...kindColumns(fields),
				logo_path: folder,
				stamp_images_path: stampFolder,
			})
			.select(PROGRAM_COLUMNS)
			.single();
		if (error) {
			await Promise.all([
				removeProgramImages(context.supabase, folder),
				stampFolder ? removeStampImages(context.supabase, stampFolder) : null,
			]);
			throw databaseError("create the program", error);
		}

		return {
			programId: row.id,
			googleWallet: await syncGoogleLoyaltyClass(context.supabase, row),
		};
	});

export const updateProgram = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: unknown) => {
		const form = parseProgramForm(data);
		return {
			...form,
			...programIdSchema.parse({ programId: form.formData.get("programId") }),
		};
	})
	.handler(async ({ data: { programId, fields, formData }, context }) => {
		// Before uploading anything: team members cannot change the program.
		await requireProgramAdmin(context.supabase, programId, context.userId);
		const { data: current, error: readError } = await context.supabase
			.from("programs")
			.select(
				"logo_path, kind, background_color, stamp_icon, stamp_images_path",
			)
			.eq("id", programId)
			.maybeSingle();
		if (readError) {
			throw databaseError("update the program", readError);
		}
		if (!current) {
			throw notFound();
		}
		if (fields.kind !== current.kind) {
			throw new Error("A program cannot switch between points and stamps.");
		}

		const images = await readProgramImages(formData);
		const folder = images
			? newImageFolder(context.userId, programId)
			: current.logo_path;
		// The card images show the stamp icon on the card color: the browser
		// draws them again whenever either changes.
		const stampImages =
			fields.kind === "stamps" ? await readStampImages(formData) : null;
		if (
			fields.kind === "stamps" &&
			!stampImages &&
			(fields.stampIcon !== current.stamp_icon ||
				fields.backgroundColor !== current.background_color)
		) {
			throw new Error(MISSING_STAMP_IMAGES);
		}
		const stampFolder = stampImages
			? newStampImageFolder(context.userId, programId)
			: current.stamp_images_path;
		await Promise.all([
			images && folder
				? uploadProgramImages(context.supabase, folder, images)
				: null,
			stampImages && stampFolder
				? uploadProgramImages(context.supabase, stampFolder, stampImages)
				: null,
		]);

		const { data: row, error } = await context.supabase
			.from("programs")
			.update({
				name: fields.name,
				background_color: fields.backgroundColor,
				...kindColumns(fields),
				logo_path: folder,
				stamp_images_path: stampFolder,
			})
			.eq("id", programId)
			.select(PROGRAM_COLUMNS)
			.maybeSingle();
		if (error || !row) {
			await Promise.all([
				images && folder ? removeProgramImages(context.supabase, folder) : null,
				stampImages && stampFolder
					? removeStampImages(context.supabase, stampFolder)
					: null,
			]);
			if (error) {
				throw databaseError("update the program", error);
			}
			throw notFound();
		}
		await Promise.all([
			images && current.logo_path
				? removeProgramImages(context.supabase, current.logo_path)
				: null,
			stampImages && current.stamp_images_path
				? removeStampImages(context.supabase, current.stamp_images_path)
				: null,
		]);

		// Apple devices download the passes again, Google passes follow their
		// class (and, for stamp cards, their objects).
		return {
			program: toProgramView(context.supabase, row),
			walletSync: await syncProgramWallets(context.supabase, row),
		};
	});

export const deleteProgram = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		await requireProgramAdmin(context.supabase, data.programId, context.userId);
		const { data: row, error } = await context.supabase
			.from("programs")
			.delete()
			.eq("id", data.programId)
			.select("logo_path, stamp_images_path")
			.maybeSingle();
		if (error) {
			throw databaseError("delete the program", error);
		}
		if (!row) {
			throw notFound();
		}
		// Google Wallet classes cannot be deleted; without passes, they stay unused.
		await Promise.all([
			row.logo_path
				? removeProgramImages(context.supabase, row.logo_path)
				: null,
			row.stamp_images_path
				? removeStampImages(context.supabase, row.stamp_images_path)
				: null,
		]);
	});

/**
 * Sends the program's design and current message to all its passes again,
 * after a sync failed. It never notifies: Apple only notifies changes the
 * device has not shown yet, and Google messages are only added by
 * `sendNotification`.
 */
export const retryProgramWalletSync = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(programIdSchema)
	.handler(async ({ data, context }) => {
		const { data: row, error } = await context.supabase
			.from("programs")
			.select(PROGRAM_TO_SYNC_COLUMNS)
			.eq("id", data.programId)
			.maybeSingle();
		if (error) {
			throw databaseError("update the cards", error);
		}
		if (!row) {
			throw notFound();
		}
		return { walletSync: await syncProgramWallets(context.supabase, row) };
	});
