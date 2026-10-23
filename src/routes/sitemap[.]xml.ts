import { createFileRoute } from "@tanstack/react-router";

import { ARTICLES } from "#/features/blog/articles";

/** The public pages for search engines: the landing page, the blog and its articles. */
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = new URL(request.url).origin;
				const pages = [
					{ path: "/", lastModified: ARTICLES[0]?.publishedAt },
					{ path: "/blog", lastModified: ARTICLES[0]?.publishedAt },
					...ARTICLES.map((article) => ({
						path: `/blog/${article.slug}`,
						lastModified: article.publishedAt,
					})),
				];
				const urls = pages
					.map(
						({ path, lastModified }) =>
							`<url><loc>${origin}${path}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ""}</url>`,
					)
					.join("");
				return new Response(
					`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
					{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
				);
			},
		},
	},
});
