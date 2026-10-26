import { describe, expect, it } from "vitest";

import { groupVisitsByDay } from "#/features/members/daily-visits";

describe("groupVisitsByDay", () => {
	const now = new Date("2026-10-26T10:00:00Z");

	it("counts every day up to today, oldest first, with 0 for quiet days", () => {
		const days = groupVisitsByDay(
			[
				{ hour: "2026-10-24T08:00:00+00:00", visits: 2 },
				{ hour: "2026-10-24T15:00:00+00:00", visits: 3 },
				{ hour: "2026-10-26T09:00:00+00:00", visits: 1 },
			],
			{ now, days: 3, timeZone: "UTC" },
		);
		expect(days).toEqual([
			{ day: "2026-10-24", visits: 5 },
			{ day: "2026-10-25", visits: 0 },
			{ day: "2026-10-26", visits: 1 },
		]);
	});

	it("groups hours into days of the time zone", () => {
		// 23:00 UTC on the 25th is already the 26th in Paris.
		const days = groupVisitsByDay(
			[{ hour: "2026-10-25T23:00:00+00:00", visits: 4 }],
			{ now, days: 2, timeZone: "Europe/Paris" },
		);
		expect(days).toEqual([
			{ day: "2026-10-25", visits: 0 },
			{ day: "2026-10-26", visits: 4 },
		]);
	});

	it("leaves out visits older than the first day", () => {
		const days = groupVisitsByDay(
			[{ hour: "2026-10-20T12:00:00+00:00", visits: 7 }],
			{ now, days: 2, timeZone: "UTC" },
		);
		expect(days.every((day) => day.visits === 0)).toBe(true);
	});

	it("steps calendar days across a DST change", () => {
		// Paris leaves summer time on October 25, 2026: that day lasts 25 hours.
		const days = groupVisitsByDay([], {
			now: new Date("2026-10-27T06:00:00Z"),
			days: 4,
			timeZone: "Europe/Paris",
		});
		expect(days.map((day) => day.day)).toEqual([
			"2026-10-24",
			"2026-10-25",
			"2026-10-26",
			"2026-10-27",
		]);
	});
});
