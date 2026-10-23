import { useState } from "react";

import type { TeamMemberView } from "#/features/team/team.server";
import { FormAlert } from "@/components/form-alert";
import { FormattedDate } from "@/components/formatted-date";
import { SkeletonText } from "@/components/skeletons";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<TeamMemberView["role"], string> = {
	admin: "Admin",
	member: "Member",
};

/**
 * The team. Admins remove members; members leave. Admins themselves stay:
 * the program's creator cannot be removed.
 */
export function TeamMemberList({
	members,
	userId,
	isAdmin,
	onRemove,
}: {
	members: TeamMemberView[];
	userId: string;
	isAdmin: boolean;
	onRemove: (member: TeamMemberView) => Promise<void>;
}) {
	return (
		<ul className="divide-y overflow-hidden rounded-2xl border">
			{members.map((member) => {
				const isYou = member.userId === userId;
				const canRemove = member.role === "member" && (isAdmin || isYou);
				return (
					<TeamMemberRow
						key={member.userId}
						member={member}
						isYou={isYou}
						removeLabel={canRemove ? (isYou ? "Leave" : "Remove") : null}
						onRemove={() => onRemove(member)}
					/>
				);
			})}
		</ul>
	);
}

function TeamMemberRow({
	member,
	isYou,
	removeLabel,
	onRemove,
}: {
	member: TeamMemberView;
	isYou: boolean;
	removeLabel: string | null;
	onRemove: () => Promise<void>;
}) {
	const [confirming, setConfirming] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function remove() {
		setPending(true);
		setError(null);
		try {
			await onRemove();
		} catch (removeError) {
			setError(
				removeError instanceof Error
					? removeError.message
					: "Could not update the team.",
			);
			setPending(false);
		}
	}

	return (
		<li className="flex flex-col gap-2 px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<span className="truncate font-medium">
						{member.email}
						{isYou ? (
							<span className="text-muted-foreground"> (you)</span>
						) : null}
					</span>
					<span className="text-muted-foreground text-sm">
						{ROLE_LABELS[member.role]} · Joined{" "}
						<FormattedDate value={member.joinedAt} />
					</span>
				</div>
				{removeLabel ? (
					confirming ? (
						<div className="flex gap-2">
							<Button
								variant="destructive"
								size="sm"
								disabled={pending}
								onClick={remove}
							>
								{pending ? "Updating…" : `Confirm: ${removeLabel}`}
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={pending}
								onClick={() => setConfirming(false)}
							>
								Cancel
							</Button>
						</div>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirming(true)}
						>
							{removeLabel}
						</Button>
					)
				) : null}
			</div>
			<FormAlert>{error}</FormAlert>
		</li>
	);
}

/** `TeamMemberList` while the team loads. */
export function TeamMemberListSkeleton({ rows = 2 }: { rows?: number }) {
	return (
		<ul aria-hidden className="divide-y overflow-hidden rounded-2xl border">
			{Array.from({ length: rows }, (_, index) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
					key={index}
					className="flex flex-col gap-2 px-4 py-3"
				>
					<div className="flex min-w-0 flex-col gap-1">
						<SkeletonText className="w-56 max-w-full" />
						<SkeletonText className="w-40 text-sm" />
					</div>
				</li>
			))}
		</ul>
	);
}
