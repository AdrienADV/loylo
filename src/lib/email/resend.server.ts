import type { EmailConfig } from "#/lib/config.server";

export interface Email {
	to: string;
	subject: string;
	html: string;
	text: string;
	/**
	 * Resend sends an email once per key for 24 hours: retrying a request
	 * with the same key and content does not send it twice.
	 */
	idempotencyKey: string;
}

/**
 * Sends a transactional email through the Resend API. Throws with Resend's
 * error name when the email is refused; callers log it and report a safe
 * message.
 */
export async function sendEmail(
	config: EmailConfig,
	email: Email,
): Promise<void> {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.resendApiKey}`,
			"Content-Type": "application/json",
			"Idempotency-Key": email.idempotencyKey,
		},
		body: JSON.stringify({
			from: config.from,
			to: [email.to],
			subject: email.subject,
			html: email.html,
			text: email.text,
		}),
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			name?: string;
			message?: string;
		} | null;
		throw new Error(
			`Resend refused the email (${response.status} ${body?.name ?? "unknown"}): ${body?.message ?? ""}`,
		);
	}
}
