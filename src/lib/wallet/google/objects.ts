import { z } from "zod";

import { hexColorSchema } from "#/lib/colors";
import {
	formatStampBalance,
	type PassBalance,
	passBalanceSchema,
} from "#/lib/wallet/balance";

/**
 * Builders for Google Wallet loyalty classes (one per program) and objects
 * (one per member pass). Pure: same input, same output.
 */

/** Suffix of a class or object ID: Google allows letters, digits, `.`, `_` and `-`. */
const idSuffixSchema = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[\w.-]+$/, "Expected letters, digits, '.', '_' or '-'");

/** Google IDs are prefixed with the issuer ID. */
export function toGoogleWalletId(issuerId: string, suffix: string): string {
	return `${issuerId}.${idSuffixSchema.parse(suffix)}`;
}

export const loyaltyClassInputSchema = z.object({
	classSuffix: idSuffixSchema,
	programName: z.string().trim().min(1).max(64),
	backgroundColor: hexColorSchema,
	/** Public HTTPS URL: Google downloads the logo itself. */
	logoUrl: z.url({ protocol: /^https$/ }),
	/** The program's current message, shown on every pass of the class. */
	message: z.string().trim().min(1).max(100).nullish(),
	/** What a full stamp card gives; stamp cards only. */
	stampReward: z.string().trim().min(1).max(40).nullish(),
});

export type LoyaltyClassInput = z.input<typeof loyaltyClassInputSchema>;

export const loyaltyObjectInputSchema = z.object({
	classSuffix: idSuffixSchema,
	objectSuffix: idSuffixSchema,
	serialNumber: z.string().min(16).max(64),
	memberName: z.string().trim().min(1).max(128),
	balance: passBalanceSchema,
	/** Stamp cards: the card image with the member's stamps. */
	heroImageUrl: z.url({ protocol: /^https$/ }).nullish(),
});

export type LoyaltyObjectInput = z.input<typeof loyaltyObjectInputSchema>;

interface LocalizedString {
	defaultValue: { language: string; value: string };
}

/**
 * A class shows at most one message, the program's current one, under a
 * fixed ID: Google keeps at most 10 messages per class.
 */
export const PROGRAM_MESSAGE_ID = "program-message";

export interface GoogleMessage {
	id: string;
	header: string;
	body: string;
	/** `TEXT_AND_NOTIFY` also notifies the holders (Android), with `addMessage`. */
	messageType: "TEXT" | "TEXT_AND_NOTIFY";
}

export interface GoogleLoyaltyClass {
	id: string;
	issuerName: string;
	programName: string;
	programLogo: {
		sourceUri: { uri: string };
		contentDescription: LocalizedString;
	};
	hexBackgroundColor: string;
	reviewStatus: "UNDER_REVIEW";
	multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES";
	callbackOptions: { url: string };
	messages?: GoogleMessage[];
	rewardsTierLabel?: string;
	rewardsTier?: string;
}

export interface GoogleLoyaltyPoints {
	label: string;
	balance: { int: number } | { string: string };
}

export interface GoogleImage {
	sourceUri: { uri: string };
	contentDescription: LocalizedString;
}

/** The fields of an object that show the member's balance. */
export interface GoogleLoyaltyBalance {
	loyaltyPoints: GoogleLoyaltyPoints;
	heroImage?: GoogleImage;
}

export interface GoogleLoyaltyObject extends GoogleLoyaltyBalance {
	id: string;
	classId: string;
	state: "ACTIVE";
	accountName: string;
	barcode: { type: "QR_CODE"; value: string };
}

function localized(value: string): LocalizedString {
	return { defaultValue: { language: "en-US", value } };
}

/**
 * Points as a number; stamps as "7/10", with the card image as the hero
 * image of the pass. Also used to patch an object when the balance changes.
 */
export function buildLoyaltyBalance(
	balance: PassBalance,
	heroImageUrl?: string | null,
): GoogleLoyaltyBalance {
	const parsed = passBalanceSchema.parse(balance);
	if (parsed.kind === "points") {
		return {
			loyaltyPoints: { label: "Points", balance: { int: parsed.points } },
		};
	}
	const stamps = formatStampBalance(parsed.stamps, parsed.cardSize);
	return {
		loyaltyPoints: { label: "Stamps", balance: { string: stamps } },
		...(heroImageUrl
			? {
					heroImage: {
						sourceUri: {
							uri: z.url({ protocol: /^https$/ }).parse(heroImageUrl),
						},
						contentDescription: localized(`${stamps} stamps`),
					},
				}
			: {}),
	};
}

export function buildProgramMessage(
	programName: string,
	message: string,
	messageType: GoogleMessage["messageType"],
): GoogleMessage {
	return {
		id: PROGRAM_MESSAGE_ID,
		header: programName,
		body: message,
		messageType,
	};
}

export function buildLoyaltyClass(
	input: LoyaltyClassInput,
	options: { issuerId: string; callbackUrl: string },
): GoogleLoyaltyClass {
	const {
		classSuffix,
		programName,
		backgroundColor,
		logoUrl,
		message,
		stampReward,
	} = loyaltyClassInputSchema.parse(input);

	return {
		id: toGoogleWalletId(options.issuerId, classSuffix),
		issuerName: programName,
		programName: "Loyalty card",
		programLogo: {
			sourceUri: { uri: logoUrl },
			contentDescription: localized(`${programName} logo`),
		},
		hexBackgroundColor: backgroundColor,
		// Required on every insert and update; Google reviews the class once.
		reviewStatus: "UNDER_REVIEW",
		// Same intent as `sharingProhibited` on Apple passes.
		multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
		// Google calls it when a pass is saved or deleted.
		callbackOptions: { url: options.callbackUrl },
		// Classes are replaced on update: this also drops older messages.
		...(message
			? { messages: [buildProgramMessage(programName, message, "TEXT")] }
			: {}),
		...(stampReward
			? { rewardsTierLabel: "Reward", rewardsTier: stampReward }
			: {}),
	};
}

export function buildLoyaltyObject(
	input: LoyaltyObjectInput,
	options: { issuerId: string },
): GoogleLoyaltyObject {
	const {
		classSuffix,
		objectSuffix,
		serialNumber,
		memberName,
		balance,
		heroImageUrl,
	} = loyaltyObjectInputSchema.parse(input);

	return {
		id: toGoogleWalletId(options.issuerId, objectSuffix),
		classId: toGoogleWalletId(options.issuerId, classSuffix),
		state: "ACTIVE",
		accountName: memberName,
		...buildLoyaltyBalance(balance, heroImageUrl),
		// Same QR code content as the Apple pass: the serial number.
		barcode: { type: "QR_CODE", value: serialNumber },
	};
}
