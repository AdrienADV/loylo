import { describe, expect, it } from "vitest";

import { buildInvitationEmail } from "#/features/team/invitation-email";

describe("buildInvitationEmail", () => {
	const email = buildInvitationEmail({
		programName: `Bob's <b>Café</b> & "Co"`,
		inviterEmail: "owner@example.com",
		link: "https://loylo.example/invite/abc?x=1&y=2",
	});

	it("escapes merchant input in the HTML version", () => {
		expect(email.html).toContain(
			"Bob&#39;s &lt;b&gt;Café&lt;/b&gt; &amp; &quot;Co&quot;",
		);
		expect(email.html).not.toContain("<b>Café</b>");
		expect(email.html).toContain(
			'href="https://loylo.example/invite/abc?x=1&amp;y=2"',
		);
	});

	it("keeps the plain text version and the subject as typed", () => {
		expect(email.subject).toBe(
			`Join the Bob's <b>Café</b> & "Co" team on Loylo`,
		);
		expect(email.text).toContain("https://loylo.example/invite/abc?x=1&y=2");
		expect(email.text).toContain("owner@example.com invited you");
	});
});
