import { useEffect, useRef, useState } from "react";
import { PassPreview } from "#/features/programs/components/pass-preview";
import { renderProgramImages } from "#/features/programs/program-images";
import {
	type ProgramKind,
	programFieldsSchema,
} from "#/features/programs/programs.schemas";
import {
	MAX_INITIAL_STAMPS,
	STAMP_ICON_KEYS,
	STAMP_ICONS,
	STAMPS_PER_CARD,
	type StampIcon,
} from "#/features/programs/stamp-card";
import { renderStampImages } from "#/features/programs/stamp-images";
import { useSchemaForm } from "#/lib/forms";
import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ProgramFormValues {
	name: string;
	backgroundColor: string;
	kind: ProgramKind;
	initialPoints: number;
	initialStamps: number;
	stampReward: string | null;
	stampIcon: StampIcon | null;
	logoUrl: string | null;
	/** Whether the program already has its stamp card images. */
	stampImageUrls: string[] | null;
}

const EMPTY_VALUES: ProgramFormValues = {
	name: "",
	backgroundColor: "#1d4fd7",
	kind: "points",
	initialPoints: 0,
	initialStamps: 0,
	stampReward: null,
	stampIcon: null,
	logoUrl: null,
	stampImageUrls: null,
};

const KIND_OPTIONS: {
	value: ProgramKind;
	label: string;
	description: string;
}[] = [
	{
		value: "points",
		label: "Points",
		description: "Customers collect points and redeem them.",
	},
	{
		value: "stamps",
		label: "Stamps",
		description: `${STAMPS_PER_CARD} stamps fill a card that gives a reward.`,
	},
];

/** Same look as the pricing period switch. */
const SEGMENT_CLASS =
	"flex cursor-pointer select-none flex-col gap-0.5 rounded-xl border px-3 py-2 text-sm transition-[color,background-color,box-shadow] duration-150 hover:bg-foreground/[0.03] has-checked:border-foreground has-checked:bg-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

/**
 * Program fields with a live pass preview. Sends a FormData with the fields
 * and, when a logo was chosen, the images generated from it; for a stamp card,
 * also its images whenever its design (icon, color) changes. The kind is only
 * chosen on creation (`kindEditable`).
 */
export function ProgramForm({
	initialValues = EMPTY_VALUES,
	kindEditable = false,
	submitLabel,
	pendingLabel,
	onSubmit,
}: {
	initialValues?: ProgramFormValues;
	kindEditable?: boolean;
	submitLabel: string;
	pendingLabel: string;
	onSubmit: (formData: FormData) => Promise<void>;
}) {
	const [name, setName] = useState(initialValues.name);
	const [backgroundColor, setBackgroundColor] = useState(
		initialValues.backgroundColor,
	);
	const [kind, setKind] = useState(initialValues.kind);
	const [initialPoints, setInitialPoints] = useState(
		String(initialValues.initialPoints),
	);
	const [initialStamps, setInitialStamps] = useState(
		String(initialValues.initialStamps),
	);
	const [stampReward, setStampReward] = useState(
		initialValues.stampReward ?? "",
	);
	const [stampIcon, setStampIcon] = useState<StampIcon>(
		initialValues.stampIcon ?? "cup",
	);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const logoInput = useRef<HTMLInputElement>(null);
	const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
	/** The stamp card design the saved images show, if any. */
	const [savedStampDesign, setSavedStampDesign] = useState(
		initialValues.stampImageUrls && initialValues.stampIcon
			? {
					backgroundColor: initialValues.backgroundColor,
					icon: initialValues.stampIcon,
				}
			: null,
	);

	useEffect(() => {
		if (!logoFile) {
			setLogoPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(logoFile);
		setLogoPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [logoFile]);

	const form = useSchemaForm(programFieldsSchema, async (fields) => {
		const formData = new FormData();
		formData.set("name", fields.name);
		formData.set("backgroundColor", fields.backgroundColor);
		formData.set("kind", fields.kind);
		if (fields.kind === "points") {
			formData.set("initialPoints", String(fields.initialPoints));
		} else {
			formData.set("initialStamps", String(fields.initialStamps));
			formData.set("stampReward", fields.stampReward);
			formData.set("stampIcon", fields.stampIcon);
		}
		if (logoFile) {
			const images = await renderProgramImages(logoFile);
			for (const [imageName, blob] of Object.entries(images)) {
				formData.set(imageName, blob, imageName);
			}
		} else if (!initialValues.logoUrl) {
			throw new Error("Add a logo.");
		}
		const stampDesign =
			fields.kind === "stamps"
				? { backgroundColor: fields.backgroundColor, icon: fields.stampIcon }
				: null;
		if (
			stampDesign &&
			(stampDesign.backgroundColor !== savedStampDesign?.backgroundColor ||
				stampDesign.icon !== savedStampDesign.icon)
		) {
			const images = await renderStampImages(stampDesign);
			for (const [imageName, blob] of Object.entries(images)) {
				formData.set(imageName, blob, imageName);
			}
		}
		await onSubmit(formData);
		// Saved: the next submit only re-uploads images that change again.
		setLogoFile(null);
		if (logoInput.current) {
			logoInput.current.value = "";
		}
		setSavedStampDesign(stampDesign);
	});

	return (
		<div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_20rem]">
			<form onSubmit={form.onSubmit} noValidate>
				<FieldGroup>
					<FormAlert>{form.formError}</FormAlert>
					{kindEditable ? (
						<FieldSet>
							<FieldLegend variant="label">Loyalty type</FieldLegend>
							<div className="grid gap-2 sm:grid-cols-2">
								{KIND_OPTIONS.map((option) => (
									<label key={option.value} className={SEGMENT_CLASS}>
										<input
											type="radio"
											name="kind"
											value={option.value}
											checked={kind === option.value}
											onChange={() => setKind(option.value)}
											className="sr-only"
										/>
										<span className="font-medium">{option.label}</span>
										<span className="text-muted-foreground">
											{option.description}
										</span>
									</label>
								))}
							</div>
							<FieldDescription>
								This cannot be changed once the program is created.
							</FieldDescription>
						</FieldSet>
					) : (
						<input type="hidden" name="kind" value={kind} />
					)}
					<FormField
						name="name"
						label="Business name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						error={form.fieldErrors.name}
					/>
					<Field
						data-invalid={form.fieldErrors.backgroundColor ? true : undefined}
					>
						<FieldLabel htmlFor="field-backgroundColor">Card color</FieldLabel>
						<div className="flex items-center gap-3">
							<input
								id="field-backgroundColor"
								name="backgroundColor"
								type="color"
								value={backgroundColor}
								onChange={(event) => setBackgroundColor(event.target.value)}
								className="h-9 w-16 cursor-pointer rounded-xl border bg-transparent"
							/>
							<span className="font-mono text-muted-foreground text-sm">
								{backgroundColor}
							</span>
						</div>
						<FieldError>{form.fieldErrors.backgroundColor}</FieldError>
					</Field>
					{kind === "points" ? (
						<FormField
							name="initialPoints"
							label="Welcome points"
							type="number"
							min={0}
							step={1}
							inputMode="numeric"
							value={initialPoints}
							onChange={(event) => setInitialPoints(event.target.value)}
							error={form.fieldErrors.initialPoints}
						/>
					) : (
						<>
							<FormField
								name="stampReward"
								label={`Reward for ${STAMPS_PER_CARD} stamps`}
								placeholder="A free coffee"
								maxLength={40}
								value={stampReward}
								onChange={(event) => setStampReward(event.target.value)}
								error={form.fieldErrors.stampReward}
							/>
							<StampIconPicker
								value={stampIcon}
								onChange={setStampIcon}
								error={form.fieldErrors.stampIcon}
							/>
							<FormField
								name="initialStamps"
								label="Welcome stamps"
								type="number"
								min={0}
								max={MAX_INITIAL_STAMPS}
								step={1}
								inputMode="numeric"
								value={initialStamps}
								onChange={(event) => setInitialStamps(event.target.value)}
								error={form.fieldErrors.initialStamps}
							/>
						</>
					)}
					<Field>
						<FieldLabel htmlFor="field-logo">Logo</FieldLabel>
						<Input
							ref={logoInput}
							id="field-logo"
							name="logo"
							type="file"
							accept="image/png,image/jpeg,image/webp"
							onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
						/>
						<FieldDescription>
							PNG, JPEG or WebP. A square logo on a transparent background works
							best.
						</FieldDescription>
					</Field>
					<Button type="submit" disabled={form.pending}>
						{form.pending ? pendingLabel : submitLabel}
					</Button>
				</FieldGroup>
			</form>
			<PassPreview
				name={name}
				backgroundColor={backgroundColor}
				points={Number.parseInt(initialPoints, 10) || 0}
				stamps={
					kind === "stamps"
						? {
								stamps: Math.min(
									Math.max(Number.parseInt(initialStamps, 10) || 0, 0),
									MAX_INITIAL_STAMPS,
								),
								icon: stampIcon,
								reward: stampReward,
							}
						: undefined
				}
				logoUrl={logoPreviewUrl ?? initialValues.logoUrl}
			/>
		</div>
	);
}

function StampIconPicker({
	value,
	onChange,
	error,
}: {
	value: StampIcon;
	onChange: (icon: StampIcon) => void;
	error?: string;
}) {
	return (
		<FieldSet data-invalid={error ? true : undefined}>
			<FieldLegend variant="label">Stamp icon</FieldLegend>
			<div className="flex flex-wrap gap-2">
				{STAMP_ICON_KEYS.map((icon) => (
					<label
						key={icon}
						title={STAMP_ICONS[icon].label}
						className={cn(
							SEGMENT_CLASS,
							"size-11 items-center justify-center p-0",
						)}
					>
						<input
							type="radio"
							name="stampIcon"
							value={icon}
							checked={value === icon}
							onChange={() => onChange(icon)}
							className="sr-only"
						/>
						<svg
							viewBox="0 0 24 24"
							role="img"
							aria-label={STAMP_ICONS[icon].label}
							className="size-5 fill-current"
						>
							<path d={STAMP_ICONS[icon].path} />
						</svg>
					</label>
				))}
			</div>
			<FieldError>{error}</FieldError>
		</FieldSet>
	);
}
