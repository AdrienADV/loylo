export type ArticleBlock =
	| { type: "p"; text: string }
	| { type: "h2"; text: string }
	| { type: "ul"; items: string[] };

export type Article = {
	slug: string;
	title: string;
	summary: string;
	category: string;
	/** ISO date, `YYYY-MM-DD`. */
	publishedAt: string;
	readingMinutes: number;
	body: ArticleBlock[];
};

/** The blog's articles, newest first. */
export const ARTICLES: Article[] = [
	{
		slug: "food-truck-loyalty",
		title: "A loyalty program for a business that moves every day",
		summary:
			"Food trucks lose regulars when they change spots. A card in the customer's wallet keeps them close, and tells them where to find you.",
		category: "Food trucks",
		publishedAt: "2026-10-20",
		readingMinutes: 4,
		body: [
			{
				type: "p",
				text: "A food truck's best customers are the ones who come back every Tuesday. The trouble is that Tuesday's spot is not always the same, and a paper stamp card can't tell anyone where you parked.",
			},
			{ type: "h2", text: "Keep the card where they already look" },
			{
				type: "p",
				text: "A card in Apple Wallet or Google Wallet sits next to boarding passes and tickets. Customers add it once, by scanning the QR code on your menu board, and it stays on their phone: no app to download, no account to create, nothing to forget at home.",
			},
			{ type: "h2", text: "Tell your regulars where you are" },
			{
				type: "p",
				text: "With Loylo you can send a short message to every card of your program. It shows on the card and notifies the phone, so it works for the news a food truck actually has:",
			},
			{
				type: "ul",
				items: [
					"“Today at the harbor market, 11:30 to 14:30.”",
					"“Closed for the holidays, back on the 6th.”",
					"“New this week: the veggie smash, double points until Friday.”",
				],
			},
			{
				type: "p",
				text: "One message a day at most: enough for the day's spot, never enough to annoy anyone.",
			},
			{ type: "h2", text: "Fast at the window" },
			{
				type: "p",
				text: "At lunch rush nobody has time for a loyalty app. Scan the customer's card with your phone's camera, add the points, and the card updates in their wallet before they get their order. Every change stays in the history, so you can check a balance when someone asks.",
			},
		],
	},
	{
		slug: "paper-stamp-cards",
		title: "Why paper stamp cards stop working, and what to use instead",
		summary:
			"Lost, forgotten, copied: the classic coffee card has its limits. Here's what a wallet card fixes, and what it keeps.",
		category: "Coffee shops",
		publishedAt: "2026-10-08",
		readingMinutes: 5,
		body: [
			{
				type: "p",
				text: "The paper card with ten stamps is a coffee shop classic for a reason: it's simple, and customers understand it at once. But ask any barista how many cards end up in a wash cycle, or how many customers say “I left it in my other jacket”.",
			},
			{ type: "h2", text: "What goes wrong with paper" },
			{
				type: "ul",
				items: [
					"Cards get lost or forgotten, so the habit breaks.",
					"Stamps are easy to copy, and hard to check.",
					"You don't know who your regulars are, or how often they come.",
					"You have no way to reach them when you launch a new drink.",
				],
			},
			{ type: "h2", text: "What a wallet card keeps" },
			{
				type: "p",
				text: "The good part of paper is that it asks nothing of the customer. A wallet card keeps that: no app, no password. Customers scan a QR code at the counter, type their name and email, and add the card to Apple Wallet or Google Wallet. It carries your name, your color and your logo.",
			},
			{ type: "h2", text: "What it adds" },
			{
				type: "p",
				text: "Points update on the phone right after you scan the card. You see your members and their history, and you can send a message to every card when something's new. And since the card lives on the phone, it's there every time they are.",
			},
			{ type: "h2", text: "Switching without losing anyone" },
			{
				type: "p",
				text: "You don't need to drop paper overnight. Put the QR code next to the till, and when a customer hands you a paper card, issue them a wallet card with the welcome points that match their stamps.",
			},
		],
	},
	{
		slug: "points-or-stamps",
		title: "Points or stamps: setting rewards that bring customers back",
		summary:
			"How many points for a coffee, when to give a reward, and how welcome points get the first visit back. A short guide for small shops.",
		category: "Guides",
		publishedAt: "2026-09-24",
		readingMinutes: 6,
		body: [
			{
				type: "p",
				text: "A good loyalty program is one your customers can explain to a friend. Before you think about percentages, think about the sentence on your counter: “Your 10th coffee is on us.”",
			},
			{ type: "h2", text: "Start from the visit, not the price" },
			{
				type: "p",
				text: "For shops where most tickets look alike, such as a coffee, a pastry or a sandwich, count visits: one point per visit, a reward at ten. For shops where baskets vary, such as a bakery on Sunday or a wine shop, count money: one point per euro, a reward at a round number.",
			},
			{ type: "h2", text: "Make the first reward feel close" },
			{
				type: "p",
				text: "Welcome points give a new member a head start. A card that starts at 2 out of 10 gets finished more often than one that starts at zero. In Loylo, you set them once for the program and every new card starts with them.",
			},
			{ type: "h2", text: "Rewards that cost you little" },
			{
				type: "ul",
				items: [
					"A free drink or pastry: low cost, high perceived value.",
					"An upgrade: a large for the price of a regular, an extra topping.",
					"Early access: the new menu or the seasonal box before everyone else.",
				],
			},
			{ type: "h2", text: "Talk to your members, rarely" },
			{
				type: "p",
				text: "A message on the card is a privilege. Keep it for things your regulars want to know: a new product, a change of hours, a double-points week. Loylo allows one message a day per program, so customers never feel spammed.",
			},
		],
	},
];

export function findArticle(slug: string) {
	return ARTICLES.find((article) => article.slug === slug);
}

export function formatArticleDate(isoDate: string) {
	return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}
