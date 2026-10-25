import { describe, expect, it } from "vitest";

import {
	buildLoyaltyBalance,
	buildLoyaltyClass,
	buildLoyaltyObject,
} from "#/lib/wallet/google/objects";

const options = {
	issuerId: "3388000000012345678",
	callbackUrl: "https://loylo.example.org/api/google/callback",
};

describe("buildLoyaltyBalance", () => {
	it("shows points as a number, without hero image", () => {
		expect(buildLoyaltyBalance({ kind: "points", points: 120 })).toEqual({
			loyaltyPoints: { label: "Points", balance: { int: 120 } },
		});
	});

	it("shows stamps as a count, with the card image as hero image", () => {
		expect(
			buildLoyaltyBalance(
				{ kind: "stamps", stamps: 7, cardSize: 10 },
				"https://cdn.example.org/stamps-7.png",
			),
		).toEqual({
			loyaltyPoints: { label: "Stamps", balance: { string: "7/10" } },
			heroImage: {
				sourceUri: { uri: "https://cdn.example.org/stamps-7.png" },
				contentDescription: {
					defaultValue: { language: "en-US", value: "7/10 stamps" },
				},
			},
		});
	});
});

describe("stamp cards", () => {
	it("puts the reward on the class and the stamps on the object", () => {
		const loyaltyClass = buildLoyaltyClass(
			{
				classSuffix: "program-1",
				programName: "Café de la Place",
				backgroundColor: "#1d4fd7",
				logoUrl: "https://cdn.example.org/logo.png",
				stampReward: "A free coffee",
			},
			options,
		);
		expect(loyaltyClass).toMatchObject({
			rewardsTierLabel: "Reward",
			rewardsTier: "A free coffee",
		});

		const loyaltyObject = buildLoyaltyObject(
			{
				classSuffix: "program-1",
				objectSuffix: "pass-1",
				serialNumber: "3f8a1c2e9b7d4f60a5e1c3b2d4f6a8c0",
				memberName: "Ada Lovelace",
				balance: { kind: "stamps", stamps: 10, cardSize: 10 },
				heroImageUrl: "https://cdn.example.org/stamps-10.png",
			},
			options,
		);
		expect(loyaltyObject.loyaltyPoints.balance).toEqual({ string: "10/10" });
		expect(loyaltyObject.heroImage?.sourceUri.uri).toBe(
			"https://cdn.example.org/stamps-10.png",
		);
	});
});
