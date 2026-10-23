import {
	RiAddLine,
	RiArrowRightLine,
	RiCheckLine,
	RiCloseLine,
	RiHistoryLine,
	RiMessage3Line,
	RiPaletteLine,
	RiQrCodeLine,
	RiScan2Line,
	RiTeamLine,
} from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import { ARTICLES, formatArticleDate } from "#/features/blog/articles";
import { NotificationPreview } from "#/features/notifications/components/notification-preview";
import { PassPreview } from "#/features/programs/components/pass-preview";
import { Pricing } from "#/features/site/components/pricing";
import {
	DISPLAY_HEADING,
	Eyebrow,
	SiteLayout,
} from "#/features/site/components/site-layout";
import { buttonVariants } from "@/components/ui/button";
import { useToastOnce } from "@/hooks/use-toast-once";

export const Route = createFileRoute("/")({
	validateSearch: z.object({
		/** Set after the account was deleted. */
		account: z.literal("deleted").optional().catch(undefined),
	}),
	head: () => ({
		meta: [
			{
				title: "Loylo · Wallet loyalty cards for coffee shops and food trucks",
			},
			{
				name: "description",
				content:
					"Loyalty cards in Apple Wallet and Google Wallet for coffee shops, bakeries, food trucks and local shops. No app for your customers, nothing to install at the counter.",
			},
		],
	}),
	component: Home,
});

const BUSINESS_TYPES = [
	"Coffee shops",
	"Bakeries",
	"Food trucks",
	"Barbers and salons",
	"Juice bars",
	"Ice cream shops",
	"Bookshops",
	"Delis",
];

const STEPS = [
	{
		title: "Design your card",
		text: "Your name, your color, your logo. See the card as you build it, and choose the welcome points every new member starts with.",
	},
	{
		title: "Customers add it in seconds",
		text: "They scan the QR code by the till or open your link, type their name and email, and add the card to Apple Wallet or Google Wallet. No app to download.",
	},
	{
		title: "Scan and reward",
		text: "Scan the card with your phone's camera, add or redeem points. The balance updates on their phone right away.",
	},
];

const FEATURES = [
	{
		icon: RiPaletteLine,
		title: "A card that looks like you",
		text: "Color, logo and name, with a live preview of the pass. Change them later: every card already out there updates.",
	},
	{
		icon: RiQrCodeLine,
		title: "A link and a QR code",
		text: "Print the QR code on your menu, a table tent or the side of your truck. Or issue a card at the counter.",
	},
	{
		icon: RiScan2Line,
		title: "Scan with your phone",
		text: "No terminal to buy: the camera of the phone you already have reads the card. A barcode scanner works too.",
	},
	{
		icon: RiMessage3Line,
		title: "Messages on the card",
		text: "Announce a new product or today's spot. It shows on the card and notifies the phone, once a day at most.",
	},
	{
		icon: RiTeamLine,
		title: "Your whole team",
		text: "Invite the people behind the counter by email. They scan and reward; you keep the settings.",
	},
	{
		icon: RiHistoryLine,
		title: "Every visit, on record",
		text: "Each member has a history of every points change, with search across all your members.",
	},
];

const BUSINESSES = [
	{
		name: "Coffee shops",
		color: "#6b3f2a",
		reward: "Your 10th coffee is on us",
		message: "The pumpkin spice latte is back. Double points until Sunday.",
	},
	{
		name: "Food trucks",
		color: "#e4572e",
		reward: "One point per visit, a free menu at 8",
		message: "Today at the harbor market, 11:30 to 14:30.",
	},
	{
		name: "Bakeries",
		color: "#c9a227",
		reward: "One point per euro, a free loaf at 50",
		message: "Galettes des rois are in, order yours for the weekend.",
	},
	{
		name: "Barbers and salons",
		color: "#1f3a5f",
		reward: "Every 6th cut, a free beard trim",
		message: "Fully booked Saturday. Two slots left on Thursday evening.",
	},
];

const COMPARISON = {
	paper: [
		"Lost in a coat pocket, or the washing machine",
		"Stamps that are easy to copy",
		"No idea who your regulars are",
		"No way to tell them what's new",
	],
	wallet: [
		"Always on the phone, next to their tickets",
		"Points checked and stored for each member",
		"Every member and visit, in one list",
		"A message on the card when you need it",
	],
};

const FAQ = [
	{
		question: "How much does it cost?",
		answer:
			"Pro is €15 a month (€12 billed yearly) for one card, with unlimited customers and messages on the card. Multi-shop is €39 a month (€32 billed yearly) for up to 5 cards. No fee per customer or per visit.",
	},
	{
		question: "Do my customers need to download an app?",
		answer:
			"No. The card goes into Apple Wallet on iPhone or Google Wallet on Android, the apps already on their phone. They only type their name and email.",
	},
	{
		question: "What do I need at the counter?",
		answer:
			"A phone with a camera. Loylo opens the scanner in the browser, so there's nothing to install. A barcode scanner works too, if you have one.",
	},
	{
		question: "How do the points reach my customer's phone?",
		answer:
			"Right after you add or redeem points, the card in their wallet updates on its own. The same happens when you change your card's color, logo or name.",
	},
	{
		question: "How often can I send a message?",
		answer:
			"Once a day per program at most, so your regulars never feel spammed. The message shows on the card and as a notification.",
	},
	{
		question: "Can my staff use it?",
		answer:
			"Yes. Invite them by email: they can scan cards, enroll customers and manage points, while you keep the program's settings.",
	},
	{
		question: "Does it work on Android too?",
		answer:
			"Yes. iPhone customers get the card in Apple Wallet, Android customers in Google Wallet. You run one program for both.",
	},
];

function Home() {
	const { account } = Route.useSearch();
	const navigate = Route.useNavigate();
	const clearAccount = useCallback(() => {
		void navigate({ search: {}, replace: true });
	}, [navigate]);
	useToastOnce(
		account === "deleted",
		{ title: "Your account and its data were deleted." },
		clearAccount,
	);

	return (
		<SiteLayout>
			<main>
				<Hero />
				<BusinessStrip />
				<HowItWorks />
				<Features />
				<Businesses />
				<Comparison />
				<Pricing />
				<Questions />
				<LatestArticles />
				<FinalCall />
			</main>
		</SiteLayout>
	);
}

const SECTION = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

function Hero() {
	return (
		<section
			className={`${SECTION} grid items-center gap-14 pt-16 pb-20 md:pt-24 lg:grid-cols-[minmax(0,1fr)_26rem]`}
		>
			<div className="flex animate-enter flex-col items-start gap-6">
				<span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 font-medium text-muted-foreground text-xs shadow-border">
					<span className="size-1.5 rounded-full bg-success" />
					For Apple Wallet and Google Wallet
				</span>
				<h1
					className={`${DISPLAY_HEADING} text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem]`}
				>
					The loyalty card your regulars never leave at home
				</h1>
				<p className="max-w-xl text-[17px] text-muted-foreground leading-8">
					Loylo puts your stamp card in your customers' phones. Made for coffee
					shops, bakeries, food trucks and every shop with regulars: they add it
					in seconds, you scan it at the counter.
				</p>
				<div className="flex flex-wrap gap-2">
					<Link to="/signup" className={buttonVariants({ size: "lg" })}>
						Create your card
						<RiArrowRightLine data-icon="inline-end" />
					</Link>
					<a
						href="#how-it-works"
						className={buttonVariants({ variant: "outline", size: "lg" })}
					>
						See how it works
					</a>
				</div>
				<ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-sm">
					{[
						"No app for your customers",
						"Set up in minutes",
						"iPhone and Android",
					].map((item) => (
						<li key={item} className="flex items-center gap-1.5">
							<RiCheckLine className="size-4 text-success" />
							{item}
						</li>
					))}
				</ul>
			</div>
			<HeroCards />
		</section>
	);
}

/** Three cards fanned out, with the notification a message sends. */
function HeroCards() {
	return (
		<div
			aria-hidden="true"
			style={{ "--stagger": 2 } as React.CSSProperties}
			className="relative mx-auto h-[25rem] w-full max-w-[26rem] animate-enter sm:h-[28rem]"
		>
			<div className="absolute top-6 left-0 w-52 -rotate-[8deg] sm:w-60">
				<PassPreview
					name="Rise Bakery"
					backgroundColor="#c9a227"
					points={34}
					logoUrl={null}
					memberName="Sam Carter"
				/>
			</div>
			<div className="absolute top-2 right-0 w-52 rotate-[7deg] sm:w-60">
				<PassPreview
					name="Smash Wagon"
					backgroundColor="#e4572e"
					points={6}
					logoUrl={null}
					memberName="Léa Martin"
				/>
			</div>
			<div className="absolute top-10 left-1/2 w-56 -translate-x-1/2 sm:w-64">
				<PassPreview
					name="Bean There Cafe"
					backgroundColor="#6b3f2a"
					points={9}
					logoUrl={null}
				/>
			</div>
			<div className="absolute right-0 bottom-0 left-0 mx-auto max-w-80 rounded-[1.75rem] bg-card/90 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_40px_-12px_rgb(0_0_0/0.3)] backdrop-blur">
				<NotificationPreview
					programName="Bean There Cafe"
					backgroundColor="#6b3f2a"
					logoUrl={null}
					message="One more coffee and the next one is on us ☕"
				/>
			</div>
		</div>
	);
}

function BusinessStrip() {
	return (
		<section className="border-border/60 border-y bg-card/60">
			<div
				className={`${SECTION} flex flex-col items-center gap-4 py-8 md:flex-row md:justify-between`}
			>
				<Eyebrow>Made for</Eyebrow>
				<ul className="flex flex-wrap justify-center gap-2">
					{BUSINESS_TYPES.map((type) => (
						<li
							key={type}
							className="rounded-full bg-background px-3 py-1 text-foreground/80 text-sm shadow-border"
						>
							{type}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function SectionHeading({
	eyebrow,
	title,
	text,
}: {
	eyebrow: string;
	title: string;
	text?: string;
}) {
	return (
		<header className="flex max-w-2xl flex-col gap-4">
			<Eyebrow>{eyebrow}</Eyebrow>
			<h2
				className={`${DISPLAY_HEADING} text-[2.25rem] leading-[1.08] sm:text-5xl`}
			>
				{title}
			</h2>
			{text && (
				<p className="text-[17px] text-muted-foreground leading-8">{text}</p>
			)}
		</header>
	);
}

function HowItWorks() {
	return (
		<section id="how-it-works" className={`${SECTION} scroll-mt-20 py-24`}>
			<SectionHeading
				eyebrow="How it works"
				title="From paper card to wallet card, in three steps"
				text="No hardware, no app for your customers, no training for your team."
			/>
			<ol className="mt-12 grid gap-8 md:grid-cols-3">
				{STEPS.map((step, index) => (
					<li
						key={step.title}
						className="flex flex-col gap-3 border-border border-t pt-6"
					>
						<span className="font-mono text-muted-foreground text-xs tabular-nums">
							{String(index + 1).padStart(2, "0")}
						</span>
						<h3 className="font-semibold text-lg tracking-tight">
							{step.title}
						</h3>
						<p className="text-[15px] text-muted-foreground leading-7">
							{step.text}
						</p>
					</li>
				))}
			</ol>
		</section>
	);
}

function Features() {
	return (
		<section
			id="features"
			className="scroll-mt-14 border-border/60 border-y bg-card/60"
		>
			<div className={`${SECTION} py-24`}>
				<SectionHeading
					eyebrow="Features"
					title="Everything a stamp card did, and what it never could"
				/>
				<div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map(({ icon: Icon, title, text }) => (
						<div
							key={title}
							className="flex flex-col gap-3 rounded-xl bg-background p-5 shadow-border"
						>
							<span className="flex size-9 items-center justify-center rounded-lg bg-muted">
								<Icon className="size-[18px]" />
							</span>
							<h3 className="font-medium">{title}</h3>
							<p className="text-muted-foreground text-sm leading-6">{text}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Businesses() {
	return (
		<section id="businesses" className={`${SECTION} scroll-mt-20 py-24`}>
			<SectionHeading
				eyebrow="Who it's for"
				title="One card, set the way your shop works"
				text="Count visits or count euros, pick the reward, and say what's new. A few ideas to start from:"
			/>
			<div className="mt-12 grid gap-3 md:grid-cols-2">
				{BUSINESSES.map((business) => (
					<article
						key={business.name}
						className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-border"
					>
						<div className="flex items-center gap-3">
							<span
								className="size-8 rounded-lg"
								style={{ backgroundColor: business.color }}
							/>
							<h3 className="font-semibold text-lg tracking-tight">
								{business.name}
							</h3>
						</div>
						<dl className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
									Reward
								</dt>
								<dd className="text-[15px]">{business.reward}</dd>
							</div>
							<div className="flex flex-col gap-1">
								<dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
									Message
								</dt>
								<dd className="text-[15px] text-foreground/80">
									“{business.message}”
								</dd>
							</div>
						</dl>
					</article>
				))}
			</div>
		</section>
	);
}

function Comparison() {
	return (
		<section className={`${SECTION} pb-24`}>
			<div className="grid overflow-hidden rounded-3xl bg-card shadow-border md:grid-cols-2">
				<div className="flex flex-col gap-5 p-8 sm:p-10">
					<Eyebrow>The paper card</Eyebrow>
					<ul className="flex flex-col gap-3">
						{COMPARISON.paper.map((item) => (
							<li
								key={item}
								className="flex items-start gap-3 text-muted-foreground"
							>
								<RiCloseLine className="mt-0.5 size-5 shrink-0 text-destructive" />
								{item}
							</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-5 border-border/70 border-t bg-muted/40 p-8 sm:p-10 md:border-t-0 md:border-l">
					<Eyebrow>The Loylo card</Eyebrow>
					<ul className="flex flex-col gap-3">
						{COMPARISON.wallet.map((item) => (
							<li key={item} className="flex items-start gap-3">
								<RiCheckLine className="mt-0.5 size-5 shrink-0 text-success" />
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}

function Questions() {
	return (
		<section
			id="faq"
			className={`${SECTION} grid scroll-mt-20 gap-12 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]`}
		>
			<SectionHeading
				eyebrow="FAQ"
				title="Common questions"
				text="What shop owners ask before they switch."
			/>
			<div className="flex flex-col divide-y divide-border/60 border-border/60 border-y">
				{FAQ.map(({ question, answer }) => (
					<details key={question} className="group py-5">
						<summary className="flex list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
							{question}
							<RiAddLine className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
						</summary>
						<p className="mt-3 text-[15px] text-foreground/80 leading-7">
							{answer}
						</p>
					</details>
				))}
			</div>
		</section>
	);
}

function LatestArticles() {
	return (
		<section className="border-border/60 border-t">
			<div className={`${SECTION} py-24`}>
				<div className="flex flex-wrap items-end justify-between gap-6">
					<SectionHeading
						eyebrow="Blog"
						title="Ideas for shops with regulars"
					/>
					<Link
						to="/blog"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						All articles
					</Link>
				</div>
				<div className="mt-12 grid gap-3 md:grid-cols-2">
					{ARTICLES.slice(0, 3).map((article) => (
						<Link
							key={article.slug}
							to="/blog/$slug"
							params={{ slug: article.slug }}
							className="group flex flex-col gap-3 rounded-xl bg-card p-5 shadow-border transition-shadow duration-150 hover:shadow-border-hover"
						>
							<Eyebrow>{article.category}</Eyebrow>
							<h3 className="font-medium text-lg leading-snug tracking-tight">
								{article.title}
							</h3>
							<p className="text-muted-foreground text-sm leading-6">
								{article.summary}
							</p>
							<span className="mt-auto flex items-center justify-between pt-2 text-muted-foreground text-xs">
								{formatArticleDate(article.publishedAt)}
								<RiArrowRightLine className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

function FinalCall() {
	return (
		<section className={`${SECTION} pb-24`}>
			<div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:py-20">
				<h2
					className={`${DISPLAY_HEADING} max-w-2xl text-[2.25rem] leading-[1.08] sm:text-5xl`}
				>
					Your next regular is already in line
				</h2>
				<p className="max-w-lg text-[17px] text-primary-foreground/70 leading-8">
					Create your card, print the QR code, and hand out the first one before
					closing time.
				</p>
				<Link
					to="/signup"
					className={buttonVariants({
						variant: "secondary",
						size: "lg",
					})}
				>
					Create your card
					<RiArrowRightLine data-icon="inline-end" />
				</Link>
			</div>
		</section>
	);
}
