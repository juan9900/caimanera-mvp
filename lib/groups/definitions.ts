import * as z from "zod";

const GroupNameSchema = z
  .string()
  .trim()
  .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
  .max(40, { error: "Máximo 40 caracteres." });

export const CreateGroupSchema = z.object({
  name: GroupNameSchema,
});

export const RenameGroupSchema = z.object({
  groupId: z.uuid({ error: "Grupo inválido." }),
  name: GroupNameSchema,
});

export const GroupIdSchema = z.object({
  groupId: z.uuid({ error: "Grupo inválido." }),
});

export const MembershipIdSchema = z.object({
  membershipId: z.uuid({ error: "Invitación inválida." }),
});

export const RemoveGroupMemberSchema = z.object({
  groupId: z.uuid({ error: "Grupo inválido." }),
  userId: z.uuid({ error: "Usuario inválido." }),
});

export const JoinGroupSchema = z.object({
  token: z.uuid({ error: "Link de invitación inválido." }),
});

export const InviteGroupToMatchSchema = z.object({
  matchId: z.uuid({ error: "Partido inválido." }),
  groupId: z.uuid({ error: "Grupo inválido." }),
});

/** Result returned by group Server Actions bound to a plain `<form action>`. */
export type GroupActionResult = { message: string } | void;

/** Form state for `createGroup`, bound via `useActionState`. */
export type CreateGroupFormState =
  | { errors?: { name?: string[] }; message?: string }
  | undefined;

/** The current user's relationship to a group, used to pick which button to show in search results. */
export type GroupRelation = "ninguna" | "invitado" | "miembro";
