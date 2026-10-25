import type { CSSProperties } from "react";

import { hexColorSchema } from "#/lib/colors";

/**
 * A length in iPhone points. The phone is drawn at the size of an iPhone
 * 15 Pro (393 pt wide, plus the bezel) and scales to the width it is given.
 */
function pt(value: number) {
	return `calc(var(--pt) * ${value})`;
}

/** The screen width plus the bezel on both sides. */
const PHONE_WIDTH = 393 + 2 * 12;

const IOS_FONT =
	'-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", "Helvetica Neue", system-ui, sans-serif';

/** A real iPhone 15 Pro home screen, 393 × 852 pt. */
const HOME_SCREEN_SRC = "/iphone-home-screen.webp";

/**
 * How the message lands on a customer's iPhone: a notification banner at the
 * top of the home screen, showing the message as it is typed.
 */
export function NotificationPreview({
	programName,
	backgroundColor,
	logoUrl,
	message,
}: {
	programName: string;
	backgroundColor: string;
	logoUrl: string | null;
	message: string;
}) {
	const text = message.trim();

	return (
		<figure
			aria-label="Notification preview on an iPhone"
			className="@container mx-auto w-full max-w-80 select-none"
			style={{
				maskImage: "linear-gradient(to bottom, black 70%, transparent)",
			}}
		>
			<div
				className="bg-neutral-900 shadow-xl"
				style={
					{
						"--pt": `calc(100cqw / ${PHONE_WIDTH})`,
						padding: `${pt(12)} ${pt(12)} 0`,
						borderRadius: `${pt(67)} ${pt(67)} 0 0`,
						fontFamily: IOS_FONT,
					} as CSSProperties
				}
			>
				<div
					className="relative overflow-hidden"
					style={{
						height: pt(360),
						borderRadius: `${pt(55)} ${pt(55)} 0 0`,
						background: `url(${HOME_SCREEN_SRC}) top / 100% auto no-repeat #4b5563`,
					}}
				>
					{/* Screenshots leave out the Dynamic Island. */}
					<div
						className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
						style={{ top: pt(11), width: pt(125), height: pt(37) }}
					/>
					<div
						className="absolute"
						style={{ top: pt(56), left: pt(10), right: pt(10) }}
					>
						<Banner
							programName={programName}
							backgroundColor={backgroundColor}
							logoUrl={logoUrl}
							message={text}
						/>
					</div>
				</div>
			</div>
		</figure>
	);
}

/**
 * The banner itself, in a light Liquid Glass: mostly opaque, with a hint of
 * the home screen through it and a lit top edge.
 */
function Banner({
	programName,
	backgroundColor,
	logoUrl,
	message,
}: {
	programName: string;
	backgroundColor: string;
	logoUrl: string | null;
	message: string;
}) {
	const color = hexColorSchema.safeParse(backgroundColor);

	return (
		<div
			className="flex items-start text-black"
			style={{
				gap: pt(10),
				padding: `${pt(13)} ${pt(14)}`,
				borderRadius: pt(26),
				background:
					"linear-gradient(to bottom, rgba(255, 255, 255, 0.94), rgba(246, 246, 248, 0.88))",
				backdropFilter: "blur(24px) saturate(180%)",
				WebkitBackdropFilter: "blur(24px) saturate(180%)",
				border: "1px solid rgba(255, 255, 255, 0.7)",
				boxShadow:
					"inset 0 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 rgba(255, 255, 255, 0.4), 0 10px 30px rgba(0, 0, 0, 0.18)",
			}}
		>
			<div
				className="flex shrink-0 items-center justify-center overflow-hidden bg-white"
				style={{
					width: pt(38),
					height: pt(38),
					borderRadius: pt(9),
					backgroundColor: color.success ? color.data : undefined,
				}}
			>
				{logoUrl ? (
					<img
						src={logoUrl}
						alt=""
						className="object-contain"
						style={{ maxWidth: pt(30), maxHeight: pt(30) }}
					/>
				) : null}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<div
					className="flex items-baseline justify-between"
					style={{ gap: pt(8) }}
				>
					<span
						className="truncate font-semibold"
						style={{
							fontSize: pt(15),
							lineHeight: pt(20),
							letterSpacing: "-0.01em",
						}}
					>
						{programName}
					</span>
					<span
						className="shrink-0"
						style={{
							fontSize: pt(13),
							lineHeight: pt(20),
							color: "rgba(60, 60, 67, 0.6)",
						}}
					>
						now
					</span>
				</div>
				<p
					className="line-clamp-4 whitespace-pre-line break-words"
					style={{
						fontSize: pt(15),
						lineHeight: pt(20),
						letterSpacing: "-0.01em",
						color: message ? undefined : "rgba(60, 60, 67, 0.45)",
					}}
				>
					{message || "Your message"}
				</p>
			</div>
		</div>
	);
}
