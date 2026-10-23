import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
	type ArticleBlock,
	findArticle,
	formatArticleDate,
} from "#/features/blog/articles";
import {
	DISPLAY_HEADING,
	Eyebrow,
	SiteLayout,
} from "#/features/site/components/site-layout";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/blog/$slug")({
	loader: ({ params }) => {
		const article = findArticle(params.slug);
		if (!article) {
			throw notFound();
		}
		return article;
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.title} · Loylo` },
					{ name: "description", content: loaderData.summary },
					{ property: "og:title", content: loaderData.title },
					{ property: "og:description", content: loaderData.summary },
					{ property: "og:type", content: "article" },
				]
			: [],
	}),
	component: ArticlePage,
});

function ArticlePage() {
	const article = Route.useLoaderData();

	return (
		<SiteLayout>
			<main className="mx-auto max-w-2xl px-4 pt-12 pb-24 sm:px-6 md:pt-16">
				<Link
					to="/blog"
					className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<RiArrowLeftLine className="size-4" />
					Blog
				</Link>
				<article className="mt-10 animate-enter">
					<header className="flex flex-col gap-4">
						<Eyebrow>
							{article.category} · {article.readingMinutes} min read
						</Eyebrow>
						<h1
							className={`${DISPLAY_HEADING} text-[2.5rem] leading-[1.05] sm:text-5xl`}
						>
							{article.title}
						</h1>
						<p className="text-[17px] text-muted-foreground leading-8">
							{article.summary}
						</p>
						<time
							dateTime={article.publishedAt}
							className="text-muted-foreground text-sm"
						>
							{formatArticleDate(article.publishedAt)}
						</time>
					</header>
					<div className="mt-10 flex flex-col gap-5 border-border/60 border-t pt-10">
						{article.body.map((block) => (
							<Block key={blockKey(block)} block={block} />
						))}
					</div>
				</article>
				<aside className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-card p-6 shadow-border sm:p-8">
					<h2 className="font-display font-[480] text-2xl tracking-[-0.02em]">
						Put your loyalty card in their wallet
					</h2>
					<p className="text-muted-foreground text-sm leading-6">
						Design your card, print the QR code, and your customers add it to
						Apple Wallet or Google Wallet in seconds.
					</p>
					<Link to="/signup" className={buttonVariants()}>
						Create your card
						<RiArrowRightLine data-icon="inline-end" />
					</Link>
				</aside>
			</main>
		</SiteLayout>
	);
}

function blockKey(block: ArticleBlock) {
	return block.type === "ul" ? block.items.join() : block.text;
}

function Block({ block }: { block: ArticleBlock }) {
	switch (block.type) {
		case "h2":
			return (
				<h2 className="mt-6 font-semibold text-xl tracking-tight">
					{block.text}
				</h2>
			);
		case "ul":
			return (
				<ul className="flex list-disc flex-col gap-2 pl-5 text-[17px] text-foreground/85 leading-8 marker:text-muted-foreground">
					{block.items.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			);
		default:
			return (
				<p className="text-[17px] text-foreground/85 leading-8">{block.text}</p>
			);
	}
}
