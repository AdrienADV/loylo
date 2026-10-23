import { useRef, useState } from "react";

import {
	type PointsChangeFields,
	pointsChangeFieldsSchema,
} from "#/features/members/members.schemas";
import { useSchemaForm } from "#/lib/forms";
import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { SkeletonButton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

/** A number of points, then "Add" or "Redeem": the clicked button decides. */
export function PointsForm({
	balance,
	onSubmit,
}: {
	/** Redeeming is off while the balance is zero. */
	balance: number;
	onSubmit: (fields: PointsChangeFields) => Promise<void>;
}) {
	const formRef = useRef<HTMLFormElement>(null);
	const [submitted, setSubmitted] =
		useState<PointsChangeFields["direction"]>("add");
	const form = useSchemaForm(pointsChangeFieldsSchema, async (fields) => {
		setSubmitted(fields.direction);
		await onSubmit(fields);
		formRef.current?.reset();
	});

	return (
		<form ref={formRef} onSubmit={form.onSubmit} noValidate>
			<FieldGroup>
				<FormAlert>{form.formError}</FormAlert>
				<FormField
					name="points"
					label="Points"
					type="number"
					inputMode="numeric"
					min={1}
					step={1}
					autoComplete="off"
					className="bg-card"
					error={form.fieldErrors.points}
				/>
				<div className="flex flex-wrap gap-2">
					<Button
						type="submit"
						name="direction"
						value="add"
						disabled={form.pending}
						className="bg-success text-white hover:bg-success/85"
					>
						{form.pending && submitted === "add" ? "Adding…" : "Add points"}
					</Button>
					<Button
						type="submit"
						name="direction"
						value="redeem"
						variant="outline"
						disabled={form.pending || balance === 0}
					>
						{form.pending && submitted === "redeem"
							? "Redeeming…"
							: "Redeem points"}
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}

/** `PointsForm` while the member loads. */
export function PointsFormSkeleton() {
	return (
		<div aria-hidden>
			<FieldGroup>
				<Field>
					<FieldLabel>Points</FieldLabel>
					<Skeleton className="h-9 rounded-3xl" />
				</Field>
				<div className="flex flex-wrap gap-2">
					<SkeletonButton>Add points</SkeletonButton>
					<SkeletonButton>Redeem points</SkeletonButton>
				</div>
			</FieldGroup>
		</div>
	);
}
