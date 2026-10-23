import { invitationFormSchema } from "#/features/team/team.schemas";
import { useSchemaForm } from "#/lib/forms";
import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { SkeletonButton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

/** Invites someone to the team by email. */
export function InviteForm({
	onInvite,
}: {
	onInvite: (email: string) => Promise<void>;
}) {
	const form = useSchemaForm(invitationFormSchema, async (data) => {
		await onInvite(data.email);
	});

	return (
		<form onSubmit={form.onSubmit} noValidate className="max-w-md">
			<FieldGroup>
				<FormAlert>{form.formError}</FormAlert>
				<FormField
					name="email"
					label="Email"
					type="email"
					autoComplete="off"
					placeholder="name@example.com"
					error={form.fieldErrors.email}
				/>
				<Button type="submit" disabled={form.pending} className="self-start">
					{form.pending ? "Inviting…" : "Invite"}
				</Button>
			</FieldGroup>
		</form>
	);
}

/** `InviteForm` while the team loads. */
export function InviteFormSkeleton() {
	return (
		<div aria-hidden className="max-w-md">
			<FieldGroup>
				<Field>
					<FieldLabel>Email</FieldLabel>
					<Skeleton className="h-9 rounded-3xl" />
				</Field>
				<SkeletonButton className="self-start">Invite</SkeletonButton>
			</FieldGroup>
		</div>
	);
}
