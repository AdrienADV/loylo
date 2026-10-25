/**
 * Generates the signed demo `.pkpass` files shown on the landing page.
 *
 * Usage: `bun scripts/demo-passes/generate.ts` (Bun loads `.env`).
 *
 * The passes use the deployment's Apple certificates but no PassKit Web
 * Service: they are frozen, so Wallet never calls the API for serials that do
 * not exist in the database. Regenerate them when the certificate is renewed.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { type HexColor, toCssRgb } from "#/lib/colors";
import {
	type ApplePassImages,
	createPkpass,
} from "#/lib/wallet/apple/pkpass.server";

const ASSETS_DIR = join(import.meta.dirname, "assets");
const OUTPUT_DIR = join(import.meta.dirname, "../../public/demo-passes");
/** Logo height in points; Wallet allows up to 50, which looks heavy. */
const LOGO_HEIGHT = 32;

interface DemoPass {
	slug: string;
	name: string;
	/** SVG or PNG logo from `assets/`. */
	logo: string;
	/** Paints the whole logo in one color; omitted keeps its own colors. */
	logoColor?: HexColor;
	/** Replaces colors in an SVG logo, keyed by the color as written in the file. */
	svgColors?: Record<string, HexColor>;
	/** Square mark from `assets/` for the icon, painted like the logo; defaults to the logo. */
	icon?: string;
	/** Shows `name` next to the logo, for logos that do not spell it. */
	showName: boolean;
	backgroundColor: HexColor;
	foregroundColor: HexColor;
	labelColor: HexColor;
	member: string;
	points: number;
	message: string;
}

// Three deep tones that read as one set: McDonald's dark green with the golden
// arches, Starbucks green and Fika's slate blue.
const DEMO_PASSES: DemoPass[] = [
	{
		slug: "mcdonalds",
		name: "McDonald's",
		logo: "mcdonalds-arches.svg",
		logoColor: "#ffc72c",
		showName: true,
		backgroundColor: "#264f36",
		foregroundColor: "#ffffff",
		labelColor: "#ffc72c",
		member: "Jordan Miller",
		points: 340,
		message: "Your free McFlurry is waiting at 400 points.",
	},
	{
		slug: "starbucks",
		name: "Starbucks",
		logo: "starbucks-siren.svg",
		// White disc with a green siren, so the logo stands out on the green.
		svgColors: { "#00643C": "#ffffff", "#FFFFFF": "#00704a" },
		showName: true,
		backgroundColor: "#00704a",
		foregroundColor: "#ffffff",
		labelColor: "#d4e9e2",
		member: "Maya Patel",
		points: 125,
		message: "Two more Stars and your next handcrafted drink is on us.",
	},
	{
		slug: "fika-coffee",
		name: "Fika Coffee",
		logo: "fika-logo.png",
		logoColor: "#ffffff",
		icon: "fika-icon.svg",
		showName: false,
		backgroundColor: "#304b5b",
		foregroundColor: "#ffffff",
		labelColor: "#f2e6d0",
		member: "Léo Bernard",
		points: 8,
		message: "Two more pour-overs and your next fika is on us.",
	},
];

/** Rasterizes the logo, painted in `color` when given (alpha is kept). */
async function loadLogo(
	file: string,
	color: HexColor | undefined,
	svgColors: Record<string, HexColor> = {},
): Promise<Buffer> {
	let source = await readFile(join(ASSETS_DIR, file));
	if (file.endsWith(".svg")) {
		// One pass, so a swap (A → B, B → A) does not repaint twice.
		const svg = source
			.toString("utf8")
			.replace(/#[0-9a-f]{6}/gi, (found) => svgColors[found] ?? found);
		source = Buffer.from(svg);
	}
	const png = await sharp(source, { density: 1200 })
		.ensureAlpha()
		.png()
		.toBuffer();
	if (!color) return png;

	const { width, height } = await sharp(png).metadata();
	const alpha = await sharp(png).extractChannel("alpha").toBuffer();
	return sharp({
		create: { width, height, channels: 3, background: color },
	})
		.joinChannel(alpha)
		.png()
		.toBuffer();
}

function renderLogo(logo: Buffer, height: number): Promise<Buffer> {
	return sharp(logo)
		.resize({ height, width: Math.round(height * 3.2), fit: "inside" })
		.png()
		.toBuffer();
}

/** Icon: the logo on the brand background, shown in notifications. */
async function renderIcon(
	logo: Buffer,
	background: HexColor,
	size: number,
): Promise<Buffer> {
	const inner = Math.round(size * 0.7);
	const mark = await sharp(logo)
		.resize({ width: inner, height: inner, fit: "inside" })
		.png()
		.toBuffer();
	return sharp({
		create: { width: size, height: size, channels: 4, background },
	})
		.composite([{ input: mark, gravity: "center" }])
		.png()
		.toBuffer();
}

async function renderImages(pass: DemoPass): Promise<ApplePassImages> {
	const logo = await loadLogo(pass.logo, pass.logoColor, pass.svgColors);
	const iconLogo = pass.icon
		? await loadLogo(pass.icon, pass.logoColor)
		: logo;
	return {
		"icon.png": await renderIcon(iconLogo, pass.backgroundColor, 29),
		"icon@2x.png": await renderIcon(iconLogo, pass.backgroundColor, 58),
		"logo.png": await renderLogo(logo, LOGO_HEIGHT),
		"logo@2x.png": await renderLogo(logo, LOGO_HEIGHT * 2),
	};
}

/** Same layout as `buildApplePassJson`, minus the PassKit Web Service. */
function buildDemoPassJson(pass: DemoPass, teamId: string, passTypeId: string) {
	const serialNumber = `demo-${pass.slug}`;
	return {
		formatVersion: 1,
		passTypeIdentifier: passTypeId,
		teamIdentifier: teamId,
		serialNumber,
		organizationName: pass.name,
		description: `${pass.name} loyalty card`,
		...(pass.showName && { logoText: pass.name }),
		backgroundColor: toCssRgb(pass.backgroundColor),
		foregroundColor: toCssRgb(pass.foregroundColor),
		labelColor: toCssRgb(pass.labelColor),
		sharingProhibited: false,
		barcodes: [
			{
				format: "PKBarcodeFormatQR",
				message: serialNumber,
				messageEncoding: "iso-8859-1",
			},
		],
		storeCard: {
			primaryFields: [{ key: "points", label: "POINTS", value: pass.points }],
			secondaryFields: [{ key: "member", label: "MEMBER", value: pass.member }],
			backFields: [{ key: "message", label: "Message", value: pass.message }],
		},
	};
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

const teamId = requireEnv("APPLE_TEAM_ID");
const passTypeId = requireEnv("APPLE_PASS_TYPE_ID");
const certificates = {
	wwdr: requireEnv("APPLE_WWDR_CERT"),
	signerCert: requireEnv("APPLE_SIGNER_CERT"),
	signerKey: requireEnv("APPLE_SIGNER_KEY"),
	signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
};

await mkdir(OUTPUT_DIR, { recursive: true });
for (const pass of DEMO_PASSES) {
	const pkpass = createPkpass({
		// The demo passes deliberately omit `webServiceURL` and `authenticationToken`.
		passJson: buildDemoPassJson(pass, teamId, passTypeId) as never,
		images: await renderImages(pass),
		certificates,
	});
	const file = join(OUTPUT_DIR, `${pass.slug}.pkpass`);
	await writeFile(file, pkpass);
	console.log(`${file} (${pkpass.byteLength} bytes)`);
}
