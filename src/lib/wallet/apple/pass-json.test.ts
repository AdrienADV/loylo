import { describe, expect, it } from "vitest";

import {
	applePassJsonSchema,
	buildApplePassJson,
} from "#/lib/wallet/apple/pass-json";

const options = {
	teamId: "ABCDE12345",
	passTypeId: "pass.org.loylo.test",
	webServiceUrl: "https://loylo.example.org/api/apple",
};

const pass = {
	serialNumber: "3f8a1c2e9b7d4f60a5e1c3b2d4f6a8c0",
	authenticationToken: "b1946ac92492d2347c6235b4d2611184",
};

describe("buildApplePassJson", () => {
	it("shows a stamp card's count and reward below the strip", () => {
		const passJson = applePassJsonSchema.parse(
			buildApplePassJson(
				{
					program: {
						name: "Café de la Place",
						backgroundColor: "#1d4fd7",
						message: null,
						stampReward: "A free coffee",
					},
					member: {
						name: "Ada Lovelace",
						balance: { kind: "stamps", stamps: 7, cardSize: 10 },
					},
					pass,
				},
				options,
			),
		);

		// Primary fields would cover the strip image that shows the stamps.
		expect(passJson.storeCard.primaryFields).toEqual([]);
		expect(passJson.storeCard.secondaryFields).toEqual([
			{
				key: "stamps",
				label: "STAMPS",
				value: "7/10",
				changeMessage: "Stamps: %@",
			},
			{ key: "reward", label: "REWARD", value: "A free coffee" },
		]);
		expect(passJson.storeCard.auxiliaryFields).toEqual([
			{ key: "member", label: "MEMBER", value: "Ada Lovelace" },
		]);
	});
});
