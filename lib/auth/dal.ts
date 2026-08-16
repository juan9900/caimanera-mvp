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
  },
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
    .select(
      "*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)",
    )
    .eq("status", "abierto")
    .order("datetime");

  return (data as MatchWithCourt[] | null) ?? [];
});

/** Fetches a single match by id, with court and organizer names, if visible to the current user. */
export const getMatch = cache(
  async (id: string): Promise<MatchWithCourt | null> => {
    const session = await verifySession();
    if (!session) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("matches")
      .select(
        "*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)",
      )
      .eq("id", id)
      .maybeSingle();

    return data as MatchWithCourt | null;
  },
);

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
  },
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
  },
);

export type NetworkUser = Pick<
  UserProfile,
  "id" | "name" | "zone" | "created_at"
>;

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

/** Whether the current user has the `is_admin` flag set. */
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const profile = await getCurrentUserProfile();
  return profile?.is_admin ?? false;
});

/** Throws if there is no session or the current user isn't an admin; use in admin Server Actions/Route Handlers. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    throw new Error("No autorizado");
  }
  return session;
}

export type AdminUser = UserProfile & {
  inviter: { name: string | null } | null;
};

/** Fetches every user profile (admin-only; relies on RLS admin bypass), most recent first. */
export const getAllUsers = cache(async (): Promise<AdminUser[]> => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (!users) return [];

  const inviterIds = [...new Set(users.map((u) => u.invited_by).filter((id) => id !== null))];

  const inviterNames = new Map<string, string | null>();
  if (inviterIds.length > 0) {
    const { data: inviters } = await supabase
      .from("users")
      .select("id, name")
      .in("id", inviterIds);
    for (const inviter of inviters ?? []) {
      inviterNames.set(inviter.id, inviter.name);
    }
  }

  return users.map((user) => ({
    ...user,
    inviter: user.invited_by
      ? { name: inviterNames.get(user.invited_by) ?? null }
      : null,
  }));
});

/** Fetches every match regardless of status/visibility (admin-only; relies on RLS admin bypass). */
export const getAllMatches = cache(async (): Promise<MatchWithCourt[]> => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      "*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)",
    )
    .order("datetime", { ascending: false });

  return (data as MatchWithCourt[] | null) ?? [];
});

/** Fetches every court (admin-only). */
export const getAllCourts = cache(async (): Promise<Court[]> => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("courts")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
});

export type AdminMetrics = {
  totalUsers: number;
  newUsersLast7Days: number;
  totalCourts: number;
  totalMatches: number;
  matchesByStatus: Record<Tables<"matches">["status"], number>;
  totalParticipants: number;
};

/** Aggregate counts for the admin dashboard (admin-only). */
export const getAdminMetrics = cache(async (): Promise<AdminMetrics | null> => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;

  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersLast7Days },
    { count: totalCourts },
    { count: totalMatches },
    { count: abiertos },
    { count: completos },
    { count: cancelados },
    { count: totalParticipants },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("courts").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "abierto"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "completo"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelado"),
    supabase
      .from("match_participants")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    newUsersLast7Days: newUsersLast7Days ?? 0,
    totalCourts: totalCourts ?? 0,
    totalMatches: totalMatches ?? 0,
    matchesByStatus: {
      abierto: abiertos ?? 0,
      completo: completos ?? 0,
      cancelado: cancelados ?? 0,
    },
    totalParticipants: totalParticipants ?? 0,
  };
});

export type ActivityEvent =
  | { type: "user_joined"; id: string; createdAt: string; name: string | null }
  | {
      type: "match_created";
      id: string;
      createdAt: string;
      sport: string;
      organizerName: string | null;
    }
  | {
      type: "join_request";
      id: string;
      createdAt: string;
      userName: string | null;
    };

/** Fetches the most recent activity across users, matches, and join requests (admin-only). */
export const getActivityFeed = cache(
  async (limit = 20): Promise<ActivityEvent[]> => {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) return [];

    const supabase = await createClient();
    const [{ data: users }, { data: matches }, { data: requests }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("matches")
          .select(
            "id, sport, created_at, organizer:users!matches_organizer_id_fkey(name)",
          )
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("match_participants")
          .select("id, created_at, user:users(name)")
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

    const events: ActivityEvent[] = [
      ...(users ?? []).map((u) => ({
        type: "user_joined" as const,
        id: u.id,
        createdAt: u.created_at,
        name: u.name,
      })),
      ...(matches ?? []).map((m) => ({
        type: "match_created" as const,
        id: m.id,
        createdAt: m.created_at,
        sport: m.sport,
        organizerName:
          (m.organizer as { name: string | null } | null)?.name ?? null,
      })),
      ...(requests ?? []).map((r) => ({
        type: "join_request" as const,
        id: r.id,
        createdAt: r.created_at,
        userName: (r.user as { name: string | null } | null)?.name ?? null,
      })),
    ];

    return events
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
);
