import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Session = {
  userId: string;
  email: string | null;
};

/**
 * Data Access Layer session check. Per Next.js 16 auth guidance, this is the
 * security boundary — call it inside every Server Action / Route Handler
 * that touches user data, never rely on `proxy.ts` or a layout for that.
 * `cache()` memoizes it per request, so calling it repeatedly is cheap.
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return { userId: user.id, email: user.email ?? null };
});

/** Throws if there is no session; use in Server Actions/Route Handlers that require auth. */
export async function requireSession(): Promise<Session> {
  const session = await verifySession();
  if (!session) {
    throw new Error("No autenticado");
  }
  return session;
}

export type UserProfile = Tables<"users">;

/** Fetches the current user's `public.users` profile row, if it exists. */
export const getCurrentUserProfile = cache(
  async (): Promise<UserProfile | null> => {
    const session = await verifySession();
    if (!session) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    return data;
  }
);

export type Court = Tables<"courts">;

/** Fetches all courts visible to the current user, alphabetically. */
export const getCourts = cache(async (): Promise<Court[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("courts").select("*").order("name");

  return data ?? [];
});

/** Fetches a single court by id, if visible to the current user. */
export const getCourt = cache(async (id: string): Promise<Court | null> => {
  const session = await verifySession();
  if (!session) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("courts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data;
});

export type Match = Tables<"matches">;
export type MatchWithCourt = Match & {
  court: Pick<Court, "id" | "name"> | null;
  organizer: { name: string | null } | null;
};

/** Fetches open matches, soonest first, with court and organizer names. */
export const getOpenMatches = cache(async (): Promise<MatchWithCourt[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)")
    .eq("status", "abierto")
    .order("datetime");

  return (data as MatchWithCourt[] | null) ?? [];
});

/** Fetches a single match by id, with court and organizer names, if visible to the current user. */
export const getMatch = cache(async (id: string): Promise<MatchWithCourt | null> => {
  const session = await verifySession();
  if (!session) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();

  return data as MatchWithCourt | null;
});

export type MatchParticipant = Tables<"match_participants"> & {
  user: { name: string | null } | null;
};

/** Fetches participants of a match, most recently joined first. */
export const getMatchParticipants = cache(
  async (matchId: string): Promise<MatchParticipant[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("match_participants")
      .select("*, user:users(name)")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });

    return (data as MatchParticipant[] | null) ?? [];
  }
);

/** Fetches the current user's participation row for a match, if any. */
export const getMyParticipation = cache(
  async (matchId: string): Promise<Tables<"match_participants"> | null> => {
    const session = await verifySession();
    if (!session) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("match_participants")
      .select("*")
      .eq("match_id", matchId)
      .eq("user_id", session.userId)
      .maybeSingle();

    return data;
  }
);

export type Invitation = Tables<"invitations">;

/** Fetches invitations created by the current user, most recent first. */
export const getOwnInvitations = cache(async (): Promise<Invitation[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("created_by", session.userId)
    .order("created_at", { ascending: false });

  return data ?? [];
});

export type NetworkUser = Pick<UserProfile, "id" | "name" | "zone" | "created_at">;

/** Fetches the users the current user invited directly (their `invited_by`), most recent first. */
export const getMyInvitees = cache(async (): Promise<NetworkUser[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, zone, created_at")
    .eq("invited_by", session.userId)
    .order("created_at", { ascending: false });

  return data ?? [];
});

/** Fetches the user who invited the current user, if any. */
export const getMyInviter = cache(async (): Promise<NetworkUser | null> => {
  const profile = await getCurrentUserProfile();
  if (!profile?.invited_by) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, zone, created_at")
    .eq("id", profile.invited_by)
    .maybeSingle();

  return data;
});
