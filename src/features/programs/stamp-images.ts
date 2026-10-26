import { MAX_PROGRAM_IMAGE_BYTES } from "#/features/programs/programs.schemas";
import {
	REWARD_ICON_PATH,
	STAMP_COUNTS,
	STAMP_ICONS,
	STAMP_IMAGE_SIZE,
	STAMPS_PER_CARD,
	type StampIcon,
	stampImageName,
} from "#/features/programs/stamp-card";
import { type HexColor, mixColors, pickForegroundColor } from "#/lib/colors";

/**
 * Draws the stamp card images in the browser: Workers cannot run native
 * image libraries. The background stays transparent, so the pass color shows
 * through; stamps use the pass's text color, and their icon the pass color.
 * Empty slots use opaque mixes of the two rather than transparency, which
 * reads washed out.
 */

export interface StampCardDesign {
	backgroundColor: HexColor;
	icon: StampIcon;
}

const COLUMNS = 5;
const ROWS = STAMPS_PER_CARD / COLUMNS;
// Wallet crops the sides of the strip when the pass is wider than the image's
// shape: the stamps stay well inside. Cells come out square, 240 px, with
// whole-pixel centers.
const PADDING_X = 150;
const PADDING_Y = 48;
const CELL_WIDTH = (STAMP_IMAGE_SIZE.width - 2 * PADDING_X) / COLUMNS;
const CELL_HEIGHT = (STAMP_IMAGE_SIZE.height - 2 * PADDING_Y) / ROWS;
const RADIUS = 96;
const ICON_SIZE = 112;
const EMPTY_LINE_WIDTH = 8;
// How much of the text color goes into each part of an empty slot.
const EMPTY_FILL_MIX = 0.08;
const EMPTY_LINE_MIX = 0.4;
const EMPTY_ICON_MIX = 0.3;
const REWARD_ICON_MIX = 0.65;

function drawIcon(
	context: CanvasRenderingContext2D,
	path: string,
	x: number,
	y: number,
) {
	context.save();
	context.translate(x - ICON_SIZE / 2, y - ICON_SIZE / 2);
	// Icon paths are drawn on a 24×24 grid.
	context.scale(ICON_SIZE / 24, ICON_SIZE / 24);
	context.fill(new Path2D(path));
	context.restore();
}

/**
 * Draws the card with `stamps` stamps on a canvas of `STAMP_IMAGE_SIZE`
 * (or scaled to it). The last slot shows the reward.
 */
export function drawStampCard(
	context: CanvasRenderingContext2D,
	design: StampCardDesign,
	stamps: number,
) {
	const background = design.backgroundColor;
	const foreground = pickForegroundColor(background);
	const emptyFill = mixColors(background, foreground, EMPTY_FILL_MIX);
	const emptyLine = mixColors(background, foreground, EMPTY_LINE_MIX);
	const emptyIcon = mixColors(background, foreground, EMPTY_ICON_MIX);
	const rewardIcon = mixColors(background, foreground, REWARD_ICON_MIX);
	context.clearRect(0, 0, STAMP_IMAGE_SIZE.width, STAMP_IMAGE_SIZE.height);

	for (let slot = 0; slot < STAMPS_PER_CARD; slot++) {
		const x = PADDING_X + CELL_WIDTH * (slot % COLUMNS) + CELL_WIDTH / 2;
		const y =
			PADDING_Y + CELL_HEIGHT * Math.floor(slot / COLUMNS) + CELL_HEIGHT / 2;
		const isReward = slot === STAMPS_PER_CARD - 1;
		const iconPath = isReward
			? REWARD_ICON_PATH
			: STAMP_ICONS[design.icon].path;

		context.beginPath();
		context.arc(x, y, RADIUS, 0, Math.PI * 2);
		if (slot < stamps) {
			context.fillStyle = foreground;
			context.fill();
			context.fillStyle = background;
			drawIcon(context, iconPath, x, y);
		} else {
			context.fillStyle = emptyFill;
			context.fill();
			context.strokeStyle = emptyLine;
			context.lineWidth = EMPTY_LINE_WIDTH;
			context.stroke();
			context.fillStyle = isReward ? rewardIcon : emptyIcon;
			drawIcon(context, iconPath, x, y);
		}
	}
}

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) =>
				blob
					? resolve(blob)
					: reject(new Error("Could not draw the stamp card.")),
			"image/png",
		);
	});
}

/** The card with 0 to 10 stamps, as PNG files named like on the server. */
export async function renderStampImages(
	design: StampCardDesign,
): Promise<Record<string, Blob>> {
	const canvas = document.createElement("canvas");
	canvas.width = STAMP_IMAGE_SIZE.width;
	canvas.height = STAMP_IMAGE_SIZE.height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Your browser cannot process images.");
	}

	const images: Record<string, Blob> = {};
	for (const stamps of STAMP_COUNTS) {
		drawStampCard(context, design, stamps);
		const blob = await toPng(canvas);
		if (blob.size > MAX_PROGRAM_IMAGE_BYTES) {
			throw new Error("Could not draw the stamp card.");
		}
		images[stampImageName(stamps)] = blob;
	}
	return images;
}
