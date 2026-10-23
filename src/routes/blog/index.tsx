import { RiArrowRightLine } from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ARTICLES, formatArticleDate } from "#/features/blog/articles";
import {
	DISPLAY_HEADING,
	Eyebrow,
	SiteLayout,
} from "#/features/site/components/site-layout";

export const Route = createFileRoute("/blog/")({
	head: () => ({
		meta: [
			{ title: "Blog · Loylo" },
			{
				name: "description",
				content:
					"Loyalty ideas for coffee shops, bakeries, food trucks and local shops: rewards, wallet cards and messages that bring regulars back.",
			},
		],
	}),
	component: BlogIndex,
});

function BlogIndex() {
	return (
		<SiteLayout>
			<main className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 md:pt-24 lg:px-8">
				<header className="flex max-w-2xl animate-enter flex-col gap-4">
					<Eyebrow>Blog</Eyebrow>
					<h1
						className={`${DISPLAY_HEADING} text-[2.75rem] leading-[1.05] sm:text-6xl`}
					>
						Ideas for shops with regulars
					</h1>
					<p className="text-[17px] text-muted-foreground leading-8">
						Rewards, wallet cards and messages: short guides for coffee shops,
						bakeries, food trucks and every business that knows its customers by
						name.
					</p>
				</header>
				<ul className="mt-14 flex flex-col divide-y divide-border/60 border-border/60 border-y">
					{ARTICLES.map((article, index) => (
						<li
							key={article.slug}
							style={{ "--stagger": index + 1 } as React.CSSProperties}
							className="animate-enter"
						>
							<Link
								to="/blog/$slug"
								params={{ slug: article.slug }}
								className="group grid gap-3 py-8 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:gap-8"
							>
								<div className="flex flex-col gap-1">
									<Eyebrow>{article.category}</Eyebrow>
									<span className="text-muted-foreground text-sm">
										{formatArticleDate(article.publishedAt)}
									</span>
								</div>
								<div className="flex flex-col gap-2">
									<h2 className="font-display font-[480] text-2xl leading-tight tracking-[-0.02em] sm:text-3xl">
										{article.title}
									</h2>
									<p className="max-w-2xl text-muted-foreground leading-7">
										{article.summary}
									</p>
								</div>
								<RiArrowRightLine className="hidden size-5 self-center text-muted-foreground transition-transform duration-150 group-hover:translate-x-1 md:block" />
							</Link>
						</li>
					))}
				</ul>
			</main>
		</SiteLayout>
	);
}
