import { createFileRoute } from "@tanstack/react-router";

/** Lets crawlers index the public pages and points them to the sitemap. */
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = new URL(request.url).origin;
				return new Response(
					`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
					{ headers: { "Content-Type": "text/plain; charset=utf-8" } },
				);
			},
		},
	},
});
