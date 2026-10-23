import type { MarkdownDocument } from "@tanstack/markdown";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { z } from "zod";

/**
 * The blog's articles: one Markdown file per article in `src/content/blog`,
 * named after its slug, with its metadata in a frontmatter block.
 */
const sources = import.meta.glob<string>("../../content/blog/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
});

const frontmatterSchema = z.object({
	title: z.string().min(1),
	summary: z.string().min(1),
	category: z.string().min(1),
	/** `YYYY-MM-DD`. */
	publishedAt: z.iso.date(),
});

export type Article = z.output<typeof frontmatterSchema> & {
	slug: string;
	readingMinutes: number;
	document: MarkdownDocument;
};

const WORDS_PER_MINUTE = 200;

/** Reads the flat `key: value` lines of a frontmatter block. */
function parseFrontmatter(frontmatter: string) {
	const fields: Record<string, string> = {};
	for (const line of frontmatter.split("\n")) {
		const match = /^(\w+):\s*(.*)$/.exec(line.trim());
		if (match) {
			fields[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
		}
	}
	return fields;
}

function loadArticle(path: string, source: string): Article {
	const slug = path.slice(path.lastIndexOf("/") + 1, -".md".length);
	// Parsed once per bundle; the routes render the AST.
	const document = parseMarkdown(source, {
		frontmatter: true,
		headingIds: true,
	});
	const metadata = frontmatterSchema.safeParse(
		parseFrontmatter(document.frontmatter ?? ""),
	);
	if (!metadata.success) {
		throw new Error(
			`Invalid frontmatter in ${path}: ${z.prettifyError(metadata.error)}`,
		);
	}
	const words = source.split(/\s+/).length;
	return {
		...metadata.data,
		slug,
		readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
		document,
	};
}

/** Newest first. */
export const ARTICLES: Article[] = Object.entries(sources)
	.map(([path, source]) => loadArticle(path, source))
	.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

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
