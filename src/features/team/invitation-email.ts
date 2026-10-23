/** Escapes text placed in HTML: program names are typed by merchants. */
export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/** The email that invites someone to a program's team. */
export function buildInvitationEmail({
	programName,
	inviterEmail,
	link,
}: {
	programName: string;
	inviterEmail: string;
	link: string;
}) {
	const program = escapeHtml(programName);
	const inviter = escapeHtml(inviterEmail);
	const href = escapeHtml(link);

	return {
		subject: `Join the ${programName} team on Loylo`,
		html: `<h2>Join the ${program} team</h2>
<p>${inviter} invited you to manage the ${program} loyalty program on Loylo: issue cards, add points and message customers.</p>
<p><a href="${href}">Accept the invitation</a></p>
<p>The link signs you in to Loylo as this email address, so do not forward this email. It expires in 7 days. If you did not expect this invitation, you can ignore it.</p>`,
		text: `${inviterEmail} invited you to manage the ${programName} loyalty program on Loylo: issue cards, add points and message customers.

Accept the invitation: ${link}

The link signs you in to Loylo as this email address, so do not forward this email. It expires in 7 days. If you did not expect this invitation, you can ignore it.`,
	};
}
