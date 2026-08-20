"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getCurrentUserProfile,
  requireSession,
  searchUsersForGroup,
  type GroupUserSearchResult,
} from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  CreateGroupSchema,
  RenameGroupSchema,
  GroupIdSchema,
  RemoveGroupMemberSchema,
  JoinGroupSchema,
  type GroupActionResult,
  type CreateGroupFormState,
} from "@/lib/groups/definitions";
import { notifyGroupInvited } from "@/lib/push/group-notifications";

/** Delegates to the DAL search, exposed as an action so client components can call it. */
export async function searchUsersForGroupAction(
  groupId: string,
  query: string
): Promise<GroupUserSearchResult[]> {
  return searchUsersForGroup(groupId, query);
}

/** Creates a group and seeds the creator as its first `miembro` row. */
export async function createGroup(
  _state: CreateGroupFormState,
  formData: FormData
): Promise<CreateGroupFormState> {
  const session = await requireSession();

  const validatedFields = CreateGroupSchema.safeParse({
    name: formData.get("name"),
  });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  const { name } = validatedFields.data;

  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, owner_id: session.userId })
    .select("id")
    .single();

  if (error || !group) {
    return { message: "No se pudo crear el grupo. Intenta de nuevo." };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: session.userId,
    status: "miembro",
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    // Roll back the orphaned group so it doesn't show up ownerless.
    await supabase.from("groups").delete().eq("id", group.id);
    return { message: "No se pudo crear el grupo. Intenta de nuevo." };
  }

  revalidatePath("/grupos");
  redirect(`/grupos/${group.id}`);
}

/** Renames a group; owner-only (enforced by the `.eq` filter and RLS both). */
export async function renameGroup(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();

  const validatedFields = RenameGroupSchema.safeParse({
    groupId: formData.get("groupId"),
    name: formData.get("name"),
  });
  if (!validatedFields.success) return { message: "Datos inválidos." };
  const { groupId, name } = validatedFields.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .eq("owner_id", session.userId);

  if (error) return { message: "No se pudo renombrar el grupo. Intenta de nuevo." };

  revalidatePath(`/grupos/${groupId}`);
  revalidatePath("/grupos");
}

/** Deletes a group; owner-only. Cascades clear its memberships. */
export async function deleteGroup(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();

  const validatedFields = GroupIdSchema.safeParse({ groupId: formData.get("groupId") });
  if (!validatedFields.success) return { message: "Grupo inválido." };
  const { groupId } = validatedFields.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("owner_id", session.userId);

  if (error) return { message: "No se pudo eliminar el grupo. Intenta de nuevo." };

  revalidatePath("/grupos");
  redirect("/grupos");
}

/**
 * Any accepted member invites one or more users, who land as `invitado`
 * pending their own acceptance. Silently skips users who already have a
 * membership row (any status), mirroring `inviteToMatch`'s idempotency.
 */
export async function inviteToGroup(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();
  const groupId = formData.get("groupId");
  const userIdsRaw = formData.get("userIds");
  if (typeof groupId !== "string" || typeof userIdsRaw !== "string") return;

  const validatedGroupId = GroupIdSchema.safeParse({ groupId });
  if (!validatedGroupId.success) return { message: "Grupo inválido." };

  const userIds = Array.from(
    new Set(
      userIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  ).filter((id) => id !== session.userId);

  if (userIds.length === 0) return { message: "Selecciona al menos una persona." };

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) return { message: "El grupo ya no existe." };

  const { data: membership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (membership?.status !== "miembro") {
    return { message: "Solo los miembros del grupo pueden invitar." };
  }

  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .in("user_id", userIds);

  const existingIds = new Set((existing ?? []).map((m) => m.user_id));
  const toInvite = userIds.filter((id) => !existingIds.has(id));

  if (toInvite.length === 0) {
    revalidatePath(`/grupos/${groupId}`);
    return;
  }

  const { error } = await supabase.from("group_members").insert(
    toInvite.map((userId) => ({
      group_id: groupId,
      user_id: userId,
      status: "invitado" as const,
      inviter_id: session.userId,
    }))
  );

  if (error) return { message: "No se pudo invitar. Intenta de nuevo." };

  const profile = await getCurrentUserProfile();
  await notifyGroupInvited(supabase, toInvite, group.name, profile?.name ?? null);

  revalidatePath(`/grupos/${groupId}`);
}

/**
 * Invitee accepts or rejects their own group invitation. Accepting confirms
 * membership directly; rejecting deletes the row so a member can invite
 * again later — same shape as `respondToInvitation` for match invites.
 */
export async function respondToGroupInvitation(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();
  const membershipId = formData.get("membershipId");
  const groupId = formData.get("groupId");
  const accept = formData.get("accept") === "true";
  if (typeof membershipId !== "string" || typeof groupId !== "string") return;

  const supabase = await createClient();

  if (!accept) {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", membershipId)
      .eq("user_id", session.userId)
      .eq("status", "invitado");

    if (error) return { message: "No se pudo rechazar la invitación. Intenta de nuevo." };

    revalidatePath("/invitaciones");
    revalidatePath("/grupos");
    revalidatePath(`/grupos/${groupId}`);
    return;
  }

  const { error } = await supabase
    .from("group_members")
    .update({ status: "miembro", joined_at: new Date().toISOString() })
    .eq("id", membershipId)
    .eq("user_id", session.userId)
    .eq("status", "invitado");

  if (error) return { message: "No se pudo aceptar la invitación. Intenta de nuevo." };

  revalidatePath("/invitaciones");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${groupId}`);
}

/** A member leaves a group. The owner can't leave — they delete the group instead. */
export async function leaveGroup(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();

  const validatedFields = GroupIdSchema.safeParse({ groupId: formData.get("groupId") });
  if (!validatedFields.success) return { message: "Grupo inválido." };
  const { groupId } = validatedFields.data;

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();

  if (group?.owner_id === session.userId) {
    return { message: "Eres el creador: para salir, elimina el grupo." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", session.userId);

  if (error) return { message: "No se pudo salir del grupo. Intenta de nuevo." };

  revalidatePath("/grupos");
  redirect("/grupos");
}

/** Owner removes another member from the group. */
export async function removeGroupMember(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();

  const validatedFields = RemoveGroupMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    userId: formData.get("userId"),
  });
  if (!validatedFields.success) return { message: "Datos inválidos." };
  const { groupId, userId } = validatedFields.data;

  if (userId === session.userId) {
    return { message: 'Usa "Eliminar grupo" si quieres cerrarlo.' };
  }

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();

  if (group?.owner_id !== session.userId) {
    return { message: "Solo el creador puede quitar jugadores." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { message: "No se pudo quitar al jugador. Intenta de nuevo." };

  revalidatePath(`/grupos/${groupId}`);
}

/** Owner rotates the group's invite link, invalidating the previous one. */
export async function rotateGroupInviteToken(formData: FormData): Promise<GroupActionResult> {
  const session = await requireSession();

  const validatedFields = GroupIdSchema.safeParse({ groupId: formData.get("groupId") });
  if (!validatedFields.success) return { message: "Grupo inválido." };
  const { groupId } = validatedFields.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ invite_token: randomUUID() })
    .eq("id", groupId)
    .eq("owner_id", session.userId);

  if (error) return { message: "No se pudo generar un nuevo link. Intenta de nuevo." };

  revalidatePath(`/grupos/${groupId}`);
}

/**
 * Joins a group by its invite token — only ever called from an explicit
 * button click (never on page load), via the `join_group_by_token` RPC.
 * Also auto-accepts a pending invitation, since clicking the link is the
 * same consent.
 */
export async function joinGroupByToken(formData: FormData): Promise<GroupActionResult> {
  await requireSession();

  const validatedFields = JoinGroupSchema.safeParse({ token: formData.get("token") });
  if (!validatedFields.success) return { message: "Link de invitación inválido." };
  const { token } = validatedFields.data;

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("join_group_by_token", {
    p_token: token,
  });

  if (error || !groupId) {
    return { message: "Este link ya no es válido. Pídele uno nuevo a quien te invitó." };
  }

  revalidatePath("/grupos");
  redirect(`/grupos/${groupId}`);
}
