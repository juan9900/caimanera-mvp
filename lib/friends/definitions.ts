import * as z from "zod";

export const SendFriendRequestSchema = z.object({
  addresseeId: z.uuid({ error: "Usuario inválido." }),
});

/** Result returned by friend Server Actions bound to a plain `<form action>`. */
export type FriendActionResult = { message: string } | void;

/** The current user's relationship to another user, used to pick which button to show in search results. */
export type FriendRelation =
  | "ninguna"
  | "pendiente_enviada"
  | "pendiente_recibida"
  | "amigos";
