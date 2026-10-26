"use client";

import {
	getVariants,
	type IconProps,
	IconWrapper,
	useAnimateIconContext,
} from "@animate-ui/react/icons";
import { motion, type Variants } from "motion/react";

type ChartColumnProps = IconProps<keyof typeof animations>;

/** Each bar grows from the axis, one after the other. */
function growBar(delay: number): Variants {
	return {
		initial: {
			scaleY: 1,
		},
		animate: {
			scaleY: [1, 0, 1],
			transition: {
				duration: 0.5,
				ease: "easeInOut",
				delay,
			},
		},
	};
}

const animations = {
	default: {
		axis: {},
		bar1: growBar(0),
		bar2: growBar(0.1),
		bar3: growBar(0.2),
	} satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ChartColumnProps) {
	const { controls } = useAnimateIconContext();
	const variants = getVariants(animations);

	return (
		<motion.svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<motion.path
				d="M3 3v16a2 2 0 0 0 2 2h16"
				variants={variants.axis}
				initial="initial"
				animate={controls}
			/>
			<motion.path
				d="M8 17v-3"
				style={{ originY: 1 }}
				variants={variants.bar1}
				initial="initial"
				animate={controls}
			/>
			<motion.path
				d="M13 17V5"
				style={{ originY: 1 }}
				variants={variants.bar2}
				initial="initial"
				animate={controls}
			/>
			<motion.path
				d="M18 17V9"
				style={{ originY: 1 }}
				variants={variants.bar3}
				initial="initial"
				animate={controls}
			/>
		</motion.svg>
	);
}

function ChartColumn(props: ChartColumnProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export {
	animations,
	ChartColumn,
	ChartColumn as ChartColumnIcon,
	type ChartColumnProps,
	type ChartColumnProps as ChartColumnIconProps,
};
