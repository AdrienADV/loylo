import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A line of text while it loads. It takes the line height of the text size
 * in `className`, so the page does not move when the text arrives.
 */
export function SkeletonText({ className }: { className?: string }) {
	return (
		<span className={cn("flex h-[1lh] items-center", className)}>
			<Skeleton className="h-[0.75em] w-full rounded-full" />
		</span>
	);
}

/** A button while the page loads: its hidden label gives it the real width. */
export function SkeletonButton({
	size,
	className,
	children,
}: VariantProps<typeof buttonVariants> & {
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			aria-hidden
			className={cn(
				buttonVariants({ size }),
				"animate-pulse bg-foreground/[0.07] text-transparent",
				className,
			)}
		>
			{children}
		</span>
	);
}
