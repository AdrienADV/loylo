import {
	type RemixiconComponentType,
	RiCalendar2Fill,
	RiCameraFill,
	RiImage2Fill,
	RiMailFill,
	RiMap2Fill,
	RiSettings3Fill,
	RiSunCloudyFill,
	RiWallet3Fill,
} from "@remixicon/react";
import { MotionConfig, motion } from "motion/react";
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

const HOME_SCREEN_APPS: {
	label: string;
	icon: RemixiconComponentType;
	background: string;
}[] = [
	{
		label: "Calendar",
		icon: RiCalendar2Fill,
		background: "linear-gradient(#ff6b6b, #e5383b)",
	},
	{
		label: "Photos",
		icon: RiImage2Fill,
		background: "linear-gradient(#ffd166, #f4a261)",
	},
	{
		label: "Camera",
		icon: RiCameraFill,
		background: "linear-gradient(#9aa0a6, #5f6368)",
	},
	{
		label: "Weather",
		icon: RiSunCloudyFill,
		background: "linear-gradient(#4facfe, #1e6fd9)",
	},
	{
		label: "Mail",
		icon: RiMailFill,
		background: "linear-gradient(#5ac8fa, #007aff)",
	},
	{
		label: "Maps",
		icon: RiMap2Fill,
		background: "linear-gradient(#a8e063, #34c759)",
	},
	{
		label: "Wallet",
		icon: RiWallet3Fill,
		background: "linear-gradient(#3a3a3c, #1c1c1e)",
	},
	{
		label: "Settings",
		icon: RiSettings3Fill,
		background: "linear-gradient(#aeaeb2, #636366)",
	},
];

/**
 * How the message lands on a customer's iPhone: a notification banner at the
 * top of the home screen, updated as the message is typed.
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
						background:
							"radial-gradient(circle at 15% 20%, #f9a8d4 0, transparent 45%), radial-gradient(circle at 85% 35%, #818cf8 0, transparent 50%), radial-gradient(circle at 40% 90%, #fb923c 0, transparent 55%), linear-gradient(160deg, #6d28d9, #db2777 55%, #f97316)",
					}}
				>
					<StatusBar />
					<HomeScreen />
					<MotionConfig reducedMotion="user">
						{/* A new key when the first letter is typed drops the banner in again. */}
						<motion.div
							key={text ? "message" : "empty"}
							className="absolute"
							style={{ top: pt(56), left: pt(10), right: pt(10) }}
							initial={{ y: "-120%", scale: 0.92, opacity: 0 }}
							animate={{ y: 0, scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 420, damping: 32 }}
						>
							<Banner
								programName={programName}
								backgroundColor={backgroundColor}
								logoUrl={logoUrl}
								message={text}
							/>
						</motion.div>
					</MotionConfig>
				</div>
			</div>
		</figure>
	);
}

/** The banner itself, in the iOS light material. */
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
				borderRadius: pt(24),
				background: "rgba(246, 246, 246, 0.84)",
				backdropFilter: "blur(30px) saturate(180%)",
				WebkitBackdropFilter: "blur(30px) saturate(180%)",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.16)",
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

/** The time, the Dynamic Island and the signal, Wi-Fi and battery glyphs. */
function StatusBar() {
	return (
		<div
			className="absolute inset-x-0 top-0 flex items-center justify-between text-white"
			style={{ height: pt(54), padding: `0 ${pt(32)} 0 ${pt(46)}` }}
		>
			<span
				className="font-semibold"
				style={{ fontSize: pt(17), letterSpacing: "-0.02em" }}
			>
				9:41
			</span>
			<div
				className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
				style={{ top: pt(11), width: pt(125), height: pt(37) }}
			/>
			<div className="flex items-center" style={{ gap: pt(6) }}>
				<svg
					aria-hidden="true"
					viewBox="0 0 18 12"
					style={{ width: pt(18), height: pt(12) }}
					fill="currentColor"
				>
					<rect x="0" y="8" width="3" height="4" rx="1" />
					<rect x="5" y="5.5" width="3" height="6.5" rx="1" />
					<rect x="10" y="3" width="3" height="9" rx="1" />
					<rect x="15" y="0" width="3" height="12" rx="1" />
				</svg>
				<svg
					aria-hidden="true"
					viewBox="0 0 16 12"
					style={{ width: pt(16), height: pt(12) }}
					fill="currentColor"
				>
					<path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .7C5.2.7 2.7 1.8.8 3.6L2 4.8a8.5 8.5 0 0 1 6-2.4Z" />
					<path d="M8 5.8c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4.1c-1.8 0-3.5.7-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Z" />
					<path d="M8 9.2c.5 0 .9.2 1.2.5L8 11.3 6.8 9.7c.3-.3.7-.5 1.2-.5Z" />
				</svg>
				<svg
					aria-hidden="true"
					viewBox="0 0 27 13"
					style={{ width: pt(27), height: pt(13) }}
					fill="none"
				>
					<rect
						x="0.5"
						y="0.5"
						width="23"
						height="12"
						rx="3.8"
						stroke="currentColor"
						strokeOpacity="0.4"
					/>
					<rect
						x="2"
						y="2"
						width="20"
						height="9"
						rx="2.5"
						fill="currentColor"
					/>
					<path
						d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
						fill="currentColor"
						fillOpacity="0.4"
					/>
				</svg>
			</div>
		</div>
	);
}

/** Two rows of generic app icons behind the banner. */
function HomeScreen() {
	return (
		<div
			aria-hidden="true"
			className="absolute inset-x-0 grid grid-cols-4"
			style={{
				top: pt(74),
				padding: `0 ${pt(27)}`,
				columnGap: pt(27),
				rowGap: pt(26),
			}}
		>
			{HOME_SCREEN_APPS.map(({ label, icon: Icon, background }) => (
				<div
					key={label}
					className="flex flex-col items-center"
					style={{ gap: pt(6) }}
				>
					<div
						className="flex aspect-square w-full items-center justify-center text-white"
						style={{ borderRadius: pt(14), background }}
					>
						<Icon style={{ width: pt(32), height: pt(32) }} />
					</div>
					<span
						className="text-white"
						style={{
							fontSize: pt(12),
							lineHeight: pt(14),
							textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
						}}
					>
						{label}
					</span>
				</div>
			))}
		</div>
	);
}
