import { z } from "zod";

import { emailSchema } from "#/features/auth/auth.schemas";
import { programIdSchema } from "#/features/programs/programs.schemas";

/** The invitation form; the server function also takes the program. */
export const invitationFormSchema = z.object({ email: emailSchema });

export const inviteTeamMemberSchema = programIdSchema.extend({
	email: emailSchema,
});

export const invitationIdSchema = programIdSchema.extend({
	invitationId: z.uuid(),
});

export const teamMemberIdSchema = programIdSchema.extend({
	userId: z.uuid(),
});

/** The secret of an invitation link: 256 random bits, in hex. */
export const invitationTokenSchema = z.object({
	token: z.string().regex(/^[0-9a-f]{64}$/),
});
