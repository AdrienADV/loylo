import type { HourlyVisits } from "#/features/members/members.server";

export interface DailyVisits {
	/** `YYYY-MM-DD`, in the time zone the visits were grouped in. */
	day: string;
	visits: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The `YYYY-MM-DD` date of `date` in `timeZone` (the viewer's if undefined). */
function dayKey(date: Date, timeZone: string | undefined): string {
	// Canadian English writes dates as `YYYY-MM-DD`.
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone,
	}).format(date);
}

/**
 * The visits of each of the last `days` days up to `now`, today included,
 * oldest first: days without visits count 0.
 */
export function groupVisitsByDay(
	hours: HourlyVisits[],
	{
		now,
		days,
		timeZone,
	}: { now: Date; days: number; timeZone: string | undefined },
): DailyVisits[] {
	// Calendar days step from today's date: hours of a day vary with DST.
	const today = new Date(`${dayKey(now, timeZone)}T00:00:00Z`).getTime();
	const totals = new Map<string, number>();
	for (let offset = days - 1; offset >= 0; offset--) {
		totals.set(new Date(today - offset * DAY_MS).toISOString().slice(0, 10), 0);
	}
	for (const { hour, visits } of hours) {
		const day = dayKey(new Date(hour), timeZone);
		const total = totals.get(day);
		if (total !== undefined) {
			totals.set(day, total + visits);
		}
	}
	return Array.from(totals, ([day, visits]) => ({ day, visits }));
}
