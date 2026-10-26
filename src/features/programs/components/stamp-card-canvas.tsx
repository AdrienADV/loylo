import { useEffect, useRef } from "react";

import {
	STAMP_IMAGE_SIZE,
	STAMPS_PER_CARD,
} from "#/features/programs/stamp-card";
import {
	drawStampCard,
	type StampCardDesign,
} from "#/features/programs/stamp-images";
import { cn } from "@/lib/utils";

/** The stamp card image, drawn live: the same drawing as the pass images. */
export function StampCardCanvas({
	design,
	stamps,
	className,
}: {
	design: StampCardDesign;
	stamps: number;
	className?: string;
}) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const { backgroundColor, icon } = design;

	useEffect(() => {
		const context = canvas.current?.getContext("2d");
		if (context) {
			drawStampCard(context, { backgroundColor, icon }, stamps);
		}
	}, [backgroundColor, icon, stamps]);

	return (
		<canvas
			ref={canvas}
			width={STAMP_IMAGE_SIZE.width}
			height={STAMP_IMAGE_SIZE.height}
			role="img"
			aria-label={`${stamps} of ${STAMPS_PER_CARD} stamps`}
			className={cn("aspect-[1500/576] w-full", className)}
		/>
	);
}
