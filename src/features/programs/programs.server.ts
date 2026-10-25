import type { SupabaseClient } from "@supabase/supabase-js";

import {
	MAX_PROGRAM_IMAGE_BYTES,
	PROGRAM_IMAGE_NAMES,
	PROGRAM_IMAGES,
	type ProgramImageName,
	type ProgramKind,
} from "#/features/programs/programs.schemas";
import {
	STAMP_IMAGE_NAMES,
	STAMP_IMAGE_SIZE,
	type StampIcon,
	stampIconSchema,
	stampImageName,
} from "#/features/programs/stamp-card";
import type { WalletSyncResult } from "#/features/wallet-sync/wallet-sync";
import { getOptionalGoogleWalletConfig } from "#/lib/config.server";
import type { Database, Tables } from "#/lib/supabase/database.types";
import { createGoogleWalletClient } from "#/lib/wallet/google/client.server";
import { buildLoyaltyClass } from "#/lib/wallet/google/objects";

type Supabase = SupabaseClient<Database>;
type ProgramRow = Pick<
	Tables<"programs">,
	| "id"
	| "name"
	| "background_color"
	| "initial_points"
	| "logo_path"
	| "wallet_message"
	| "created_at"
	| "kind"
	| "initial_stamps"
	| "stamp_reward"
	| "stamp_icon"
	| "stamp_images_path"
>;
export type ProgramImages = Record<ProgramImageName, Uint8Array<ArrayBuffer>>;
/** The stamp card images, by file name (`stamps-0.png` to `stamps-10.png`). */
export type StampImages = Record<string, Uint8Array<ArrayBuffer>>;

const BUCKET = "program-assets";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export const PROGRAM_COLUMNS =
	"id, name, background_color, initial_points, logo_path, wallet_message, created_at, kind, initial_stamps, stamp_reward, stamp_icon, stamp_images_path" as const;

/**
 * With the team row of the signed-in user: filter it on
 * `program_members.user_id`. The inner join leaves out programs without it.
 */
export const TEAM_PROGRAM_COLUMNS =
	`${PROGRAM_COLUMNS}, program_members!inner(role)` as const;

export type ProgramRole = Database["public"]["Enums"]["program_role"];

/** What the browser receives: no storage paths, ready-to-use image URLs. */
export interface ProgramView {
	id: string;
	name: string;
	backgroundColor: string;
	initialPoints: number;
	logoUrl: string | null;
	/** Latest message sent to the program's passes. */
	walletMessage: string | null;
	createdAt: string;
	kind: ProgramKind;
	initialStamps: number;
	/** What a full stamp card gives. */
	stampReward: string | null;
	stampIcon: StampIcon | null;
}

function imageUrl(supabase: Supabase, folder: string, name: string) {
	return supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${name}`).data
		.publicUrl;
}

export function toProgramView(
	supabase: Supabase,
	row: ProgramRow,
): ProgramView {
	return {
		id: row.id,
		name: row.name,
		backgroundColor: row.background_color,
		initialPoints: row.initial_points,
		logoUrl: row.logo_path
			? imageUrl(supabase, row.logo_path, "apple-logo@2x.png")
			: null,
		walletMessage: row.wallet_message,
		createdAt: row.created_at,
		kind: row.kind,
		initialStamps: row.initial_stamps,
		stampReward: row.stamp_reward,
		// An icon removed from the catalog shows as none: the form asks again.
		stampIcon: stampIconSchema.safeParse(row.stamp_icon).data ?? null,
	};
}

/** Public URL of the stamp card image with `stamps` stamps. */
export function stampImageUrl(
	supabase: Supabase,
	folder: string,
	stamps: number,
): string {
	return imageUrl(supabase, folder, stampImageName(stamps));
}

/** A program of the signed-in user, with their role in its team. */
export interface TeamProgramView extends ProgramView {
	role: ProgramRole;
}

export function toTeamProgramView(
	supabase: Supabase,
	row: ProgramRow & { program_members: { role: ProgramRole }[] },
): TeamProgramView {
	const [membership] = row.program_members;
	if (!membership) {
		throw new Error(`No team row for program ${row.id}`);
	}
	return { ...toProgramView(supabase, row), role: membership.role };
}

/** PNG dimensions, read from the IHDR chunk, or `null` if not a PNG. */
function readPngSize(bytes: Uint8Array) {
	if (
		bytes.length < 24 ||
		PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)
	) {
		return null;
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
}

function hasExpectedSize(name: ProgramImageName, bytes: Uint8Array): boolean {
	const size = readPngSize(bytes);
	const spec = PROGRAM_IMAGES[name];
	if (!size) {
		return false;
	}
	return spec.fit === "square"
		? size.width === spec.width && size.height === spec.height
		: size.width > 0 &&
				size.height > 0 &&
				size.width <= spec.width &&
				size.height <= spec.height;
}

/**
 * Reads the images generated in the browser from the uploaded logo. Returns
 * `null` when the form does not change the logo.
 */
export async function readProgramImages(
	formData: FormData,
): Promise<ProgramImages | null> {
	const files = PROGRAM_IMAGE_NAMES.map(
		(name) => [name, formData.get(name)] as const,
	);
	if (files.every(([, file]) => file === null)) {
		return null;
	}

	const images: Partial<ProgramImages> = {};
	for (const [name, file] of files) {
		if (!(file instanceof File)) {
			throw new Error("Some logo images are missing. Choose the logo again.");
		}
		if (file.size > MAX_PROGRAM_IMAGE_BYTES) {
			throw new Error("This logo is too detailed. Use a simpler image.");
		}
		const bytes = new Uint8Array(await file.arrayBuffer());
		if (!hasExpectedSize(name, bytes)) {
			throw new Error("The logo images are invalid. Choose the logo again.");
		}
		images[name] = bytes;
	}
	return images as ProgramImages;
}

/**
 * Reads the stamp card images generated in the browser. Returns `null` when
 * the form does not change them.
 */
export async function readStampImages(
	formData: FormData,
): Promise<StampImages | null> {
	const files = STAMP_IMAGE_NAMES.map(
		(name) => [name, formData.get(name)] as const,
	);
	if (files.every(([, file]) => file === null)) {
		return null;
	}

	const images: StampImages = {};
	for (const [name, file] of files) {
		if (!(file instanceof File) || file.size > MAX_PROGRAM_IMAGE_BYTES) {
			throw new Error("The stamp card images are invalid. Save again.");
		}
		const bytes = new Uint8Array(await file.arrayBuffer());
		const size = readPngSize(bytes);
		if (
			size?.width !== STAMP_IMAGE_SIZE.width ||
			size.height !== STAMP_IMAGE_SIZE.height
		) {
			throw new Error("The stamp card images are invalid. Save again.");
		}
		images[name] = bytes;
	}
	return images;
}

/**
 * Each logo version gets its own folder (`{owner}/{program}/{version}`), so
 * URLs never change content and Google Wallet or CDNs never show a stale logo.
 */
export function newImageFolder(ownerId: string, programId: string): string {
	return `${ownerId}/${programId}/${Date.now().toString(36)}`;
}

/** Same rule for the stamp card images, next to the logo folders. */
export function newStampImageFolder(
	ownerId: string,
	programId: string,
): string {
	return `${ownerId}/${programId}/stamps-${Date.now().toString(36)}`;
}

export async function uploadProgramImages(
	supabase: Supabase,
	folder: string,
	images: ProgramImages | StampImages,
): Promise<void> {
	await Promise.all(
		Object.entries(images).map(async ([name, bytes]) => {
			const { error } = await supabase.storage
				.from(BUCKET)
				.upload(`${folder}/${name}`, bytes, {
					contentType: "image/png",
					cacheControl: "31536000",
				});
			if (error) {
				throw new Error(`Could not upload the images: ${error.message}`);
			}
		}),
	);
}

export async function downloadProgramImage(
	supabase: Supabase,
	folder: string,
	name: string,
): Promise<Uint8Array<ArrayBuffer>> {
	const { data, error } = await supabase.storage
		.from(BUCKET)
		.download(`${folder}/${name}`);
	if (error) {
		throw new Error(`Could not download ${folder}/${name}: ${error.message}`);
	}
	return new Uint8Array(await data.arrayBuffer());
}

/** Best effort: a leftover image is harmless, so failures are only logged. */
export async function removeProgramImages(
	supabase: Supabase,
	folder: string,
): Promise<void> {
	const { error } = await supabase.storage
		.from(BUCKET)
		.remove(PROGRAM_IMAGE_NAMES.map((name) => `${folder}/${name}`));
	if (error) {
		console.error("Could not remove program images", folder, error.message);
	}
}

/** Best effort, like `removeProgramImages`. */
export async function removeStampImages(
	supabase: Supabase,
	folder: string,
): Promise<void> {
	const { error } = await supabase.storage
		.from(BUCKET)
		.remove(STAMP_IMAGE_NAMES.map((name) => `${folder}/${name}`));
	if (error) {
		console.error("Could not remove stamp images", folder, error.message);
	}
}

/** Storage lists and removes files a page at a time. */
const STORAGE_PAGE_SIZE = 100;

/** Paths of every file under `folder`, in its subfolders too. */
async function listFiles(
	supabase: Supabase,
	folder: string,
): Promise<string[]> {
	const paths: string[] = [];
	for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
		const { data, error } = await supabase.storage
			.from(BUCKET)
			.list(folder, { limit: STORAGE_PAGE_SIZE, offset });
		if (error) {
			throw new Error(`Could not list ${folder}: ${error.message}`);
		}
		for (const item of data) {
			const path = `${folder}/${item.name}`;
			// Folders are listed without an ID.
			paths.push(...(item.id ? [path] : await listFiles(supabase, path)));
		}
		if (data.length < STORAGE_PAGE_SIZE) {
			return paths;
		}
	}
}

/**
 * Removes every image the owner uploaded, leftovers of failed removals
 * included (`{owner}/...`). Throws when a file cannot be removed.
 */
export async function removeOwnerImages(
	supabase: Supabase,
	ownerId: string,
): Promise<void> {
	const paths = await listFiles(supabase, ownerId);
	for (let start = 0; start < paths.length; start += STORAGE_PAGE_SIZE) {
		const { error } = await supabase.storage
			.from(BUCKET)
			.remove(paths.slice(start, start + STORAGE_PAGE_SIZE));
		if (error) {
			throw new Error(`Could not remove the images: ${error.message}`);
		}
	}
}

/**
 * Creates or updates the program's Google Wallet class. Never throws: the
 * program is saved either way, and saving it again retries the sync.
 */
export async function syncGoogleLoyaltyClass(
	supabase: Supabase,
	row: Pick<
		ProgramRow,
		| "id"
		| "name"
		| "background_color"
		| "logo_path"
		| "wallet_message"
		| "stamp_reward"
	>,
): Promise<WalletSyncResult> {
	const config = getOptionalGoogleWalletConfig();
	if (!config || !row.logo_path) {
		return "skipped";
	}
	try {
		const loyaltyClass = buildLoyaltyClass(
			{
				classSuffix: row.id,
				programName: row.name,
				backgroundColor: row.background_color,
				logoUrl: imageUrl(supabase, row.logo_path, "google-logo.png"),
				message: row.wallet_message,
				stampReward: row.stamp_reward,
			},
			config,
		);
		await createGoogleWalletClient(config.serviceAccount).upsertLoyaltyClass(
			loyaltyClass,
		);
		return "synced";
	} catch (error) {
		console.error("Google Wallet class sync failed", row.id, error);
		return "failed";
	}
}
