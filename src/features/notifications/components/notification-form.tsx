import { useState } from "react";

import {
	MAX_MESSAGE_LENGTH,
	notificationFieldsSchema,
} from "#/features/notifications/notifications.schemas";
import { useSchemaForm } from "#/lib/forms";
import { FormAlert } from "@/components/form-alert";
import { SkeletonButton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

/**
 * Writes a message. The page owns the text so it can preview it as it is
 * typed. Sending takes a confirmation: it reaches every customer and cannot
 * be undone.
 */
export function NotificationForm({
	message,
	onMessageChange,
	disabled,
	onSend,
}: {
	message: string;
	onMessageChange: (message: string) => void;
	/** The sending rules do not allow a message now. */
	disabled: boolean;
	onSend: (message: string) => Promise<void>;
}) {
	const [confirming, setConfirming] = useState(false);
	const form = useSchemaForm(notificationFieldsSchema, async (fields) => {
		if (!confirming) {
			setConfirming(true);
			return;
		}
		try {
			await onSend(fields.message);
			onMessageChange("");
		} finally {
			setConfirming(false);
		}
	});

	return (
		<form onSubmit={form.onSubmit} noValidate className="flex flex-col gap-4">
			<FormAlert>{form.formError}</FormAlert>
			<Field data-invalid={form.fieldErrors.message ? true : undefined}>
				<div className="flex items-baseline justify-between gap-2">
					<FieldLabel htmlFor="field-message">Message</FieldLabel>
					<span className="text-muted-foreground text-xs tabular-nums">
						{message.length}/{MAX_MESSAGE_LENGTH}
					</span>
				</div>
				<Textarea
					id="field-message"
					name="message"
					rows={3}
					maxLength={MAX_MESSAGE_LENGTH}
					value={message}
					onChange={(event) => onMessageChange(event.target.value)}
					readOnly={confirming}
					disabled={disabled}
					placeholder="Double points on every coffee this weekend!"
					aria-invalid={form.fieldErrors.message ? true : undefined}
				/>
				<FieldError>{form.fieldErrors.message}</FieldError>
			</Field>
			{confirming ? (
				<div className="flex flex-col gap-3 rounded-2xl border p-4">
					<p className="text-sm">
						Send this message to every customer with the card? It cannot be
						undone.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button type="submit" disabled={form.pending}>
							{form.pending ? "Sending…" : "Send now"}
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={form.pending}
							onClick={() => setConfirming(false)}
						>
							Edit
						</Button>
					</div>
				</div>
			) : (
				<Button type="submit" className="self-start" disabled={disabled}>
					Send to all members
				</Button>
			)}
		</form>
	);
}

/** `NotificationForm` while the sending rules load. */
export function NotificationFormSkeleton() {
	return (
		<div aria-hidden className="flex flex-col gap-4">
			<Field>
				<div className="flex items-baseline justify-between gap-2">
					<FieldLabel>Message</FieldLabel>
					<span className="text-muted-foreground text-xs tabular-nums">
						0/{MAX_MESSAGE_LENGTH}
					</span>
				</div>
				<Skeleton className="h-16" />
			</Field>
			<SkeletonButton className="self-start">
				Send to all members
			</SkeletonButton>
		</div>
	);
}
