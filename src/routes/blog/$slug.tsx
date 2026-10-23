import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { findArticle, formatArticleDate } from "#/features/blog/articles";
import {
	DISPLAY_HEADING,
	Eyebrow,
	SiteLayout,
} from "#/features/site/components/site-layout";
import { buttonVariants } from "@/components/ui/button";
import { getAppOrigin } from "@/lib/app-origin";

export const Route = createFileRoute("/blog/$slug")({
	loader: ({ params }) => {
		const article = findArticle(params.slug);
		if (!article) {
			throw notFound();
		}
		return { article, url: `${getAppOrigin()}/blog/${article.slug}` };
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return {};
		}
		const { article, url } = loaderData;
		return {
			meta: [
				{ title: `${article.title} · Loylo` },
				{ name: "description", content: article.summary },
				{ property: "og:type", content: "article" },
				{ property: "og:url", content: url },
				{ property: "og:title", content: article.title },
				{ property: "og:description", content: article.summary },
				{ property: "article:published_time", content: article.publishedAt },
				{ property: "article:section", content: article.category },
				{ name: "twitter:card", content: "summary" },
			],
			links: [{ rel: "canonical", href: url }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BlogPosting",
						headline: article.title,
						description: article.summary,
						datePublished: article.publishedAt,
						articleSection: article.category,
						mainEntityOfPage: url,
						publisher: { "@type": "Organization", name: "Loylo" },
					}),
				},
			],
		};
	},
	component: ArticlePage,
});

const PROSE = "text-[17px] text-foreground/85 leading-8";

/** Article styles, by the tag each Markdown element renders to. */
const components = {
	h2: (props) => (
		<h2
			{...props}
			className="mt-6 scroll-mt-20 font-semibold text-xl tracking-tight"
		/>
	),
	h3: (props) => (
		<h3 {...props} className="mt-4 scroll-mt-20 font-semibold text-lg" />
	),
	p: (props) => <p {...props} className={PROSE} />,
	ul: (props) => (
		<ul
			{...props}
			className={`${PROSE} flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground`}
		/>
	),
	ol: (props) => (
		<ol
			{...props}
			className={`${PROSE} flex list-decimal flex-col gap-2 pl-5 marker:text-muted-foreground`}
		/>
	),
	strong: (props) => (
		<strong {...props} className="font-semibold text-foreground" />
	),
	a: (props) => (
		<a {...props} className="underline underline-offset-4 hover:opacity-80" />
	),
	table: (props) => (
		<div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
			<table {...props} className="w-full min-w-[36rem] text-left text-sm" />
		</div>
	),
	th: (props) => (
		<th
			{...props}
			className="border-border border-b px-3 py-2 align-bottom font-medium text-muted-foreground first:pl-0"
		/>
	),
	td: (props) => (
		<td
			{...props}
			className="border-border/60 border-b px-3 py-2.5 align-top first:pl-0 first:font-medium"
		/>
	),
	blockquote: (props) => (
		<blockquote
			{...props}
			className="border-border border-l-2 pl-5 text-muted-foreground italic"
		/>
	),
} satisfies MarkdownComponents;

function ArticlePage() {
	const { article } = Route.useLoaderData();

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
						<Markdown components={components}>{article.document}</Markdown>
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
