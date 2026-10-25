import { useEffect, useState } from "react";

/** Marketing messages of the demo passes, shown one after the other. */
const NOTIFICATIONS = [
	{
		slug: "fika-coffee",
		name: "Fika Coffee",
		message: "Your next fika is on us ☕",
	},
	{
		slug: "mcdonalds",
		name: "McDonald's",
		message: "Double points on McFlurry this weekend 🍦",
	},
	{
		slug: "starbucks",
		name: "Starbucks",
		message: "Happy birthday! Your next drink is on us 🎂",
	},
];

const VISIBLE_MS = 5000;

/**
 * An iOS notification cycling through the demo brands. Each one drops in from
 * above, stays a moment, then rises back up before the next one comes down.
 */
export function HeroNotifications() {
	const [index, setIndex] = useState(0);
	const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

	useEffect(() => {
		if (phase === "out") return;
		const timer = setTimeout(() => setPhase("out"), VISIBLE_MS);
		return () => clearTimeout(timer);
	}, [phase]);

	return (
		<Notification
			key={index}
			{...NOTIFICATIONS[index]}
			className={
				phase === "in"
					? "animate-notification-in"
					: phase === "out"
						? "animate-notification-out"
						: undefined
			}
			onAnimationEnd={() => {
				if (phase !== "out") return;
				setIndex((index + 1) % NOTIFICATIONS.length);
				setPhase("in");
			}}
		/>
	);
}

function Notification({
	slug,
	name,
	message,
	className,
	onAnimationEnd,
}: (typeof NOTIFICATIONS)[number] & {
	className?: string;
	onAnimationEnd?: () => void;
}) {
	return (
		<figure
			onAnimationEnd={onAnimationEnd}
			className={`flex items-center gap-3.5 rounded-full bg-[#f2f2f7] py-3 pr-6 pl-3 shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_10px_28px_-12px_rgb(0_0_0/0.28)] dark:bg-neutral-800 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_10px_28px_-12px_rgb(0_0_0/0.6)] ${className ?? ""}`}
		>
			<img
				src={`/demo-passes/${slug}-icon.png`}
				alt=""
				width={48}
				height={48}
				className="size-12 shrink-0 rounded-full"
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex items-baseline justify-between gap-3">
					<span className="truncate font-semibold text-[17px] leading-6">
						{name}
					</span>
					<span className="shrink-0 text-[#8e8e93] text-[15px]">now</span>
				</div>
				<p className="truncate text-[16px] leading-6">{message}</p>
			</div>
		</figure>
	);
}
