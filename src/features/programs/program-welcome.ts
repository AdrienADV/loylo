import type { ProgramKind } from "#/features/programs/programs.schemas";
import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";

interface WelcomeProgram {
	kind: ProgramKind;
	initialPoints: number;
	initialStamps: number;
	stampReward: string | null;
}

function plural(count: number, word: string): string {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * What a new member starts with, as sentences addressed to `who`, or nothing
 * when a points program gives no welcome points.
 */
export function welcomeText(
	program: WelcomeProgram,
	who: "You" | "New members" = "You",
): string {
	if (program.kind === "points") {
		return program.initialPoints > 0
			? `${who} start with ${plural(program.initialPoints, "point")}.`
			: "";
	}
	const reward = `Collect ${STAMPS_PER_CARD} stamps for ${program.stampReward ?? "a reward"}.`;
	return program.initialStamps > 0
		? `${reward} ${who} start with ${plural(program.initialStamps, "stamp")}.`
		: reward;
}
