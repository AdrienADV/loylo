import { useRef, useState } from "react";

import {
	type StampsChangeFields,
	stampsChangeFieldsSchema,
} from "#/features/members/members.schemas";
import { STAMPS_PER_CARD } from "#/features/programs/stamp-card";
import { useSchemaForm } from "#/lib/forms";
import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

/**
 * A number of stamps, then "Add" or "Remove" (a mistake): the clicked button
 * decides. On a full card, adding gives the reward and starts a new card.
 */
export function StampsForm({
	stamps,
	onSubmit,
}: {
	/** Stamps on the member's card. */
	stamps: number;
	onSubmit: (fields: StampsChangeFields) => Promise<void>;
}) {
	const formRef = useRef<HTMLFormElement>(null);
	const [submitted, setSubmitted] =
		useState<StampsChangeFields["direction"]>("add");
	const full = stamps === STAMPS_PER_CARD;
	// A full card starts over, so a whole new card fits.
	const room = full ? STAMPS_PER_CARD : STAMPS_PER_CARD - stamps;
	const form = useSchemaForm(
		stampsChangeFieldsSchema.refine(
			(fields) => fields.direction === "remove" || fields.stamps <= room,
			{
				path: ["stamps"],
				message: `Only ${room} more ${room === 1 ? "stamp fits" : "stamps fit"} on this card.`,
			},
		),
		async (fields) => {
			setSubmitted(fields.direction);
			await onSubmit(fields);
			formRef.current?.reset();
		},
	);

	return (
		<form ref={formRef} onSubmit={form.onSubmit} noValidate>
			<div className="flex flex-col gap-4">
				<FormAlert>{form.formError}</FormAlert>
				<FormField
					name="stamps"
					label="Stamps"
					type="number"
					inputMode="numeric"
					min={1}
					max={room}
					step={1}
					defaultValue={1}
					autoComplete="off"
					className="bg-card"
					error={form.fieldErrors.stamps}
				/>
				<div className="flex flex-wrap gap-2">
					<Button
						type="submit"
						name="direction"
						value="add"
						disabled={form.pending}
						className="bg-success text-white hover:bg-success/85"
					>
						{form.pending && submitted === "add"
							? "Adding…"
							: full
								? "Give the reward and add"
								: "Add stamps"}
					</Button>
					<Button
						type="submit"
						name="direction"
						value="remove"
						variant="outline"
						disabled={form.pending || stamps === 0}
					>
						{form.pending && submitted === "remove"
							? "Removing…"
							: "Remove stamps"}
					</Button>
				</div>
			</div>
		</form>
	);
}
