/**
 * Turns the Wallet screenshots of the demo passes into the landing page cards.
 *
 * Usage: `bun scripts/demo-passes/cards.ts` (needs the SF Pro Display font).
 *
 * The screenshots all show the same member: each card gets the name its pass
 * carries in `generate.ts`, drawn over the old one. The card is then cropped,
 * its corners rounded and saved as WebP.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const SCREENSHOTS_DIR = join(import.meta.dirname, "screenshots");
const OUTPUT_DIR = join(import.meta.dirname, "../../public/demo-passes");

// Screenshots taken on an iPhone at @3x: the card spans x 48–1120.
const CARD = { left: 48, width: 1072, height: 1504, radius: 50 };
const NAME = { x: 92, fontSize: 61, eraseFrom: 85, eraseTo: 520 };

const CARDS = [
	// `top`: first row of the card; `nameBaseline`: baseline of the member name.
	{ slug: "starbucks", top: 70, nameBaseline: 807, name: "Maya Patel" },
	{ slug: "mcdonalds", top: 111, nameBaseline: 849, name: "Jordan Miller" },
	{ slug: "fika-coffee", top: 54, nameBaseline: 789, name: "Léo Bernard" },
];

for (const card of CARDS) {
	const { data, info } = await sharp(join(SCREENSHOTS_DIR, `${card.slug}.png`))
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	// Erase the old name, each row painted with the card color at its left margin.
	for (let y = card.nameBaseline - 50; y <= card.nameBaseline + 16; y++) {
		const source = (y * info.width + 70) * 3;
		for (let x = NAME.eraseFrom; x < NAME.eraseTo; x++) {
			const target = (y * info.width + x) * 3;
			data.copyWithin(target, source, source + 3);
		}
	}

	const name = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"><text x="${NAME.x}" y="${card.nameBaseline}" font-family="SF Pro Display" font-size="${NAME.fontSize}" fill="#ffffff">${card.name}</text></svg>`,
	);
	const corners = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}"><rect width="${CARD.width}" height="${CARD.height}" rx="${CARD.radius}" fill="#fff"/></svg>`,
	);

	const named = await sharp(data, {
		raw: { width: info.width, height: info.height, channels: 3 },
	})
		.composite([{ input: name }])
		.png()
		.toBuffer();
	const rounded = await sharp(named)
		.extract({
			left: CARD.left,
			top: card.top,
			width: CARD.width,
			height: CARD.height,
		})
		.ensureAlpha()
		.composite([{ input: corners, blend: "dest-in" }])
		.png()
		.toBuffer();

	const file = join(OUTPUT_DIR, `${card.slug}.webp`);
	await sharp(rounded).resize({ width: 640 }).webp({ quality: 88 }).toFile(file);
	console.log(file);
}

// App icons for the notifications shown under the cards: the brand mark on
// the card color, square (the page rounds the corners).
const ICON_SIZE = 120;
const ICONS: {
	slug: string;
	mark: string;
	background: string;
	/** Colors to replace in the SVG, keyed as written in the file. */
	colors: Record<string, string>;
	scale: number;
}[] = [
	{
		slug: "mcdonalds",
		mark: "mcdonalds-arches.svg",
		background: "#264f36",
		colors: { "#fc0": "#ffc72c" },
		scale: 0.62,
	},
	{
		slug: "starbucks",
		mark: "starbucks-siren.svg",
		background: "#00704a",
		colors: { "#00643C": "#ffffff", "#FFFFFF": "#00704a" },
		scale: 0.8,
	},
	{
		slug: "fika-coffee",
		mark: "fika-icon.svg",
		background: "#304b5b",
		colors: { "#304b5b": "#ffffff" },
		scale: 0.62,
	},
];

for (const icon of ICONS) {
	// One pass, so a swap (A → B, B → A) does not repaint twice.
	const svg = (
		await readFile(join(import.meta.dirname, "assets", icon.mark), "utf8")
	).replace(
		/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi,
		(found) => icon.colors[found] ?? found,
	);
	const inner = Math.round(ICON_SIZE * icon.scale);
	const mark = await sharp(Buffer.from(svg), { density: 600 })
		.resize({ width: inner, height: inner, fit: "inside" })
		.png()
		.toBuffer();
	const file = join(OUTPUT_DIR, `${icon.slug}-icon.png`);
	await sharp({
		create: {
			width: ICON_SIZE,
			height: ICON_SIZE,
			channels: 4,
			background: icon.background,
		},
	})
		.composite([{ input: mark, gravity: "center" }])
		.png()
		.toFile(file);
	console.log(file);
}
