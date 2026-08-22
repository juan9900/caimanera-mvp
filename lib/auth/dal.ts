import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { HomeCourt, HomeMatch } from "@/lib/matches/home";
import { sortCourtsForPicker } from "@/lib/courts/sort";
import type { FriendRelation } from "@/lib/friends/definitions";
import type { GroupRelation } from "@/lib/groups/definitions";

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

export type UserLocation = { label: string; lat: number; lng: number };

/**
 * The current user's app-wide location (set via the header's location
 * selector, `components/location/location-selector.tsx`), used to center
 * maps and compute distances. `null` if they haven't set one yet.
 */
export const getUserLocation = cache(async (): Promise<UserLocation | null> => {
  const profile = await getCurrentUserProfile();
  if (!profile?.location_label || profile.location_lat == null || profile.location_lng == null) {
    return null;
  }
  return { label: profile.location_label, lat: profile.location_lat, lng: profile.location_lng };
});

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

/**
 * The current user's own 1-5 rating for a court, or `null` if they haven't
 * rated it (or aren't signed in). Used to preload the rating widget on the
 * court detail page — the aggregate (`rating_avg`/`rating_count`) lives
 * directly on the `courts` row, kept in sync by a DB trigger.
 */
export const getMyRatingForCourt = cache(async (courtId: string): Promise<number | null> => {
  const session = await verifySession();
  if (!session) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("court_ratings")
    .select("rating")
    .eq("court_id", courtId)
    .eq("user_id", session.userId)
    .maybeSingle();

  return data?.rating ?? null;
});

export type Match = Tables<"matches">;
export type MatchWithCourt = Match & {
  court: Pick<Court, "id" | "name"> | null;
  organizer: { name: string | null } | null;
};

/**
 * Fetches open matches, soonest first, with court and organizer names.
 * Only `visibility = "publica"` matches are included — "amigos" and
 * "privada" are only reachable via the friends' feed or a direct
 * link/invitation, not through browsing.
 */
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
    .eq("visibility", "publica")
    .order("datetime");

  return (data as MatchWithCourt[] | null) ?? [];
});

/**
 * Fetches every match the current user organizes — any status, public or
 * private — so they always have a way to find their own matches (e.g. a
 * private one, which `getOpenMatches` deliberately excludes). Most recently
 * created first.
 */
export const getMyMatches = cache(async (): Promise<MatchWithCourt[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      "*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)",
    )
    .eq("organizer_id", session.userId)
    .order("created_at", { ascending: false });

  return (data as MatchWithCourt[] | null) ?? [];
});

/**
 * Fetches every match the current user is involved in — organizing OR
 * joined as a confirmed participant — soonest first. Used by `/partidos`'s
 * "Mis partidos" tab: `getMyMatches` alone only covers the organizer half,
 * which left matches you'd merely joined feeling like they belonged nowhere.
 */
export const getMyInvolvedMatches = cache(async (): Promise<MatchWithCourt[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const matchSelect =
    "*, court:courts(id, name), organizer:users!matches_organizer_id_fkey(name)";

  const [organizedResult, participantRows] = await Promise.all([
    supabase.from("matches").select(matchSelect).eq("organizer_id", session.userId),
    supabase
      .from("match_participants")
      .select("match_id")
      .eq("user_id", session.userId)
      .eq("status", "confirmado"),
  ]);

  const organized = (organizedResult.data as MatchWithCourt[] | null) ?? [];
  const joinedMatchIds = (participantRows.data ?? [])
    .map((row) => row.match_id)
    .filter((id): id is string => id !== null && !organized.some((m) => m.id === id));

  const joined =
    joinedMatchIds.length > 0
      ? ((
          await supabase.from("matches").select(matchSelect).in("id", joinedMatchIds)
        ).data as MatchWithCourt[] | null) ?? []
      : [];

  return [...organized, ...joined].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
});

/**
 * Fetches open matches, soonest first, with enough court fields (geo +
 * is_official) for the home screen. Only `visibility = "publica"` matches
 * are included — see `getOpenMatches`. Also excludes the current user's own
 * matches — no point telling someone their own match "needs players" on the
 * home feed (they already know; see `getMyMatches` for their own).
 */
export const getOpenMatchesWithCourtGeo = cache(
  async (): Promise<HomeMatch[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("matches")
      .select(
        "*, court:courts(id, name, lat, lng, is_official, photos, logo_url, amenities, promo_text, promo_code, promo_expires_at, sponsored_until, sponsor_priority), organizer:users!matches_organizer_id_fkey(name)",
      )
      .eq("status", "abierto")
      .eq("visibility", "publica")
      .neq("organizer_id", session.userId)
      .order("datetime");

    return (data as HomeMatch[] | null) ?? [];
  },
);

/**
 * Fetches open matches with `visibility = "amigos"` organized by one of the
 * current user's accepted friends — the "De tus amigos" section on the home
 * screen. This is the one visibility level explicitly meant to surface to
 * friends only: `publica` already appears in the open feed, and `privada` is
 * deliberately excluded here too (link/invitation only, never shown to
 * anyone browsing, not even friends). RLS already allows reading any
 * `status = "abierto"` match regardless of `visibility`, so this only needs
 * the friend-id filter, not a policy change.
 */
export const getFriendsMatches = cache(
  async (): Promise<HomeMatch[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();

    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "aceptada")
      .or(`requester_id.eq.${session.userId},addressee_id.eq.${session.userId}`);

    const friendIds = (friendships ?? [])
      .map((row) =>
        row.requester_id === session.userId ? row.addressee_id : row.requester_id,
      )
      .filter((id): id is string => id !== null);

    if (friendIds.length === 0) return [];

    const { data } = await supabase
      .from("matches")
      .select(
        "*, court:courts(id, name, lat, lng, is_official, photos, logo_url, amenities, promo_text, promo_code, promo_expires_at, sponsored_until, sponsor_priority), organizer:users!matches_organizer_id_fkey(name)",
      )
      .eq("status", "abierto")
      .eq("visibility", "amigos")
      .in("organizer_id", friendIds)
      .order("datetime");

    return (data as HomeMatch[] | null) ?? [];
  },
);

/**
 * Fetches courts for the home screen's featured banner/row: courts with an
 * active paid sponsorship (`sponsored_until` in the future) PLUS courts
 * marked `is_official` for free by an admin (e.g. the anchor court). Actively
 * paying courts are ranked first (by `sponsor_priority`, then name) so
 * sponsorship visibly buys top placement over the free official ones.
 */
export const getOfficialCourts = cache(async (): Promise<HomeCourt[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("courts")
    .select(
      "id, name, lat, lng, address, sports, is_official, photos, logo_url, amenities, promo_text, promo_code, promo_expires_at, sponsored_until, sponsor_priority, rating_avg, rating_count",
    )
    .or(`is_official.eq.true,sponsored_until.gt.${new Date().toISOString()}`)
    .order("name");

  return sortCourtsForPicker(data ?? []);
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
  user: { name: string | null; id: string } | null;
};

/** Fetches participants of a match, most recently joined first. */
export const getMatchParticipants = cache(
  async (matchId: string): Promise<MatchParticipant[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("match_participants")
      .select("*, user:users(name, id)")
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

export type MatchInvitation = {
  participantId: string;
  match: HomeMatch;
};

/**
 * Fetches the current user's pending match invitations (`invitado` rows) —
 * always private matches, since `invitado` only exists on those (see
 * `inviteToMatch`). Soonest match first.
 */
export const getMyInvitations = cache(async (): Promise<MatchInvitation[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("match_participants")
    .select(
      "id, match:matches(*, court:courts(id, name, lat, lng, is_official, photos, logo_url, amenities, promo_text, promo_code, promo_expires_at, sponsored_until, sponsor_priority), organizer:users!matches_organizer_id_fkey(name))",
    )
    .eq("user_id", session.userId)
    .eq("status", "invitado");

  if (!data) return [];

  return data
    .filter((row): row is typeof row & { match: HomeMatch } => row.match !== null)
    .filter((row) => row.match.status === "abierto")
    .map((row) => ({ participantId: row.id, match: row.match }))
    .sort((a, b) => a.match.datetime.localeCompare(b.match.datetime));
});

export type NetworkUser = Pick<UserProfile, "id" | "name" | "created_at">;

/** Fetches the users the current user invited directly (their `invited_by`), most recent first. */
export const getMyInvitees = cache(async (): Promise<NetworkUser[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, created_at")
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
    .select("id, name, created_at")
    .eq("id", profile.invited_by)
    .maybeSingle();

  return data;
});

export type Friend = {
  friendshipId: string;
  user: NetworkUser;
};

/** Fetches the current user's accepted friends (either side of the pair), most recently accepted first. */
export const getMyFriends = cache(async (): Promise<Friend[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select(
      "id, requester_id, addressee_id, requester:users!friendships_requester_id_fkey(id, name, created_at), addressee:users!friendships_addressee_id_fkey(id, name, created_at)"
    )
    .eq("status", "aceptada")
    .or(`requester_id.eq.${session.userId},addressee_id.eq.${session.userId}`)
    .order("responded_at", { ascending: false });

  if (!data) return [];

  return data
    .map((row) => ({
      friendshipId: row.id,
      user: row.requester_id === session.userId ? row.addressee : row.requester,
    }))
    .filter((f): f is Friend => f.user !== null);
});

export type FriendRequest = {
  friendshipId: string;
  user: NetworkUser;
};

/** Fetches pending friend requests sent to the current user, most recent first. */
export const getIncomingFriendRequests = cache(
  async (): Promise<FriendRequest[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("friendships")
      .select("id, requester:users!friendships_requester_id_fkey(id, name, created_at)")
      .eq("status", "pendiente")
      .eq("addressee_id", session.userId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data
      .filter((row) => row.requester !== null)
      .map((row) => ({ friendshipId: row.id, user: row.requester as NetworkUser }));
  },
);

/** Fetches pending friend requests the current user sent, most recent first. */
export const getOutgoingFriendRequests = cache(
  async (): Promise<FriendRequest[]> => {
    const session = await verifySession();
    if (!session) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("friendships")
      .select("id, addressee:users!friendships_addressee_id_fkey(id, name, created_at)")
      .eq("status", "pendiente")
      .eq("requester_id", session.userId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data
      .filter((row) => row.addressee !== null)
      .map((row) => ({ friendshipId: row.id, user: row.addressee as NetworkUser }));
  },
);

export type UserSearchResult = NetworkUser & {
  relation: FriendRelation;
};

/** Fetches the current user's friendship relation with each given user id. Empty ids array short-circuits. */
export async function getFriendRelations(userIds: string[]): Promise<Map<string, FriendRelation>> {
  const session = await verifySession();
  if (!session || userIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${session.userId},addressee_id.in.(${userIds.join(",")})),and(addressee_id.eq.${session.userId},requester_id.in.(${userIds.join(",")}))`
    );

  const relationByUserId = new Map<string, FriendRelation>();
  for (const f of friendships ?? []) {
    const otherId = f.requester_id === session.userId ? f.addressee_id : f.requester_id;
    if (f.status === "aceptada") {
      relationByUserId.set(otherId, "amigos");
    } else if (f.status === "pendiente") {
      relationByUserId.set(
        otherId,
        f.requester_id === session.userId ? "pendiente_enviada" : "pendiente_recibida"
      );
    }
  }

  return relationByUserId;
}

/** Of the given user ids, returns the ones who share an accepted group with the current user. */
export async function getGroupRelations(userIds: string[]): Promise<Set<string>> {
  const session = await verifySession();
  if (!session || userIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data: myGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.userId)
    .eq("status", "miembro");

  const groupIds = (myGroups ?? []).map((g) => g.group_id);
  if (groupIds.length === 0) return new Set();

  const { data: shared } = await supabase
    .from("group_members")
    .select("user_id")
    .in("group_id", groupIds)
    .in("user_id", userIds)
    .eq("status", "miembro");

  return new Set((shared ?? []).map((row) => row.user_id));
}

/** Searches other users by name or phone, tagging each with the current friendship relation. */
export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  const session = await verifySession();
  if (!session) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, name, created_at")
    .neq("id", session.userId)
    .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
    .limit(20);

  if (!users || users.length === 0) return [];

  const relationByUserId = await getFriendRelations(users.map((u) => u.id));

  return users.map((user) => ({
    ...user,
    relation: relationByUserId.get(user.id) ?? "ninguna",
  }));
};

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

  const inviterIds = [
    ...new Set(users.map((u) => u.invited_by).filter((id) => id !== null)),
  ];

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

export type CourtMetrics = {
  impression: number;
  click: number;
  whatsapp: number;
  directions: number;
  promo_copy: number;
  match_created: number;
};

const EMPTY_COURT_METRICS: CourtMetrics = {
  impression: 0,
  click: 0,
  whatsapp: 0,
  directions: 0,
  promo_copy: 0,
  match_created: 0,
};

/**
 * Aggregates a court's `court_events` from the last 30 days (admin-only) —
 * the "is the sponsorship worth it" report: impressions/clicks on the home
 * banner, WhatsApp/directions taps and promo copies on its detail page, and
 * matches created there.
 */
export const getCourtMetrics = cache(
  async (courtId: string): Promise<CourtMetrics | null> => {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) return null;

    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("court_events")
      .select("type")
      .eq("court_id", courtId)
      .gte("created_at", thirtyDaysAgo);

    const counts = { ...EMPTY_COURT_METRICS };
    for (const row of data ?? []) {
      if (row.type in counts) counts[row.type as keyof CourtMetrics] += 1;
    }
    return counts;
  },
);

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
    { count: vencidos },
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
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "vencido"),
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
      vencido: vencidos ?? 0,
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

export type Group = Tables<"groups">;

export type GroupMemberRow = {
  membershipId: string;
  status: "miembro" | "invitado";
  user: NetworkUser;
  friendRelation: FriendRelation;
};

export type GroupSummary = {
  group: Group;
  memberCount: number;
  isOwner: boolean;
};

export type GroupDetail = {
  group: Group;
  isOwner: boolean;
  members: GroupMemberRow[];
  invited: GroupMemberRow[];
};

export type GroupInvitation = {
  membershipId: string;
  groupId: string;
  groupName: string;
  inviter: NetworkUser | null;
};

export type GroupUserSearchResult = UserSearchResult & {
  groupRelation: GroupRelation;
};

export type GroupPreview = {
  id: string;
  name: string;
  ownerName: string | null;
  memberCount: number;
};

/** Fetches the groups the current user belongs to (`miembro` rows only), most recently created first. */
export const getMyGroups = cache(async (): Promise<GroupSummary[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("group:groups!group_members_group_id_fkey(*)")
    .eq("user_id", session.userId)
    .eq("status", "miembro");

  if (!data) return [];

  const groups = data
    .map((row) => row.group)
    .filter((g): g is Group => g !== null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (groups.length === 0) return [];

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .in(
      "group_id",
      groups.map((g) => g.id)
    )
    .eq("status", "miembro");

  const counts = new Map<string, number>();
  for (const row of memberRows ?? []) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }

  return groups.map((group) => ({
    group,
    memberCount: counts.get(group.id) ?? 1,
    isOwner: group.owner_id === session.userId,
  }));
});

/** Fetches a single group's detail (members + pending invitees), or `null` if it doesn't exist or isn't visible to the current user (RLS). */
export const getGroup = cache(async (groupId: string): Promise<GroupDetail | null> => {
  const session = await verifySession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) return null;

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("id, status, user:users!group_members_user_id_fkey(id, name, created_at)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  const validRows = (memberRows ?? []).filter(
    (row): row is typeof row & { user: NetworkUser } => row.user !== null
  );
  const relationByUserId = await getFriendRelations(validRows.map((row) => row.user.id));
  const rows: GroupMemberRow[] = validRows.map((row) => ({
    membershipId: row.id,
    status: row.status,
    user: row.user,
    friendRelation: row.user.id === session.userId ? "amigos" : relationByUserId.get(row.user.id) ?? "ninguna",
  }));

  return {
    group,
    isOwner: group.owner_id === session.userId,
    members: rows.filter((r) => r.status === "miembro"),
    invited: rows.filter((r) => r.status === "invitado"),
  };
});

/** Fetches the accepted member ids of a group — used by `inviteGroupToMatch`; empty if the group doesn't exist or isn't visible (RLS). */
export const getGroupMemberIds = cache(async (groupId: string): Promise<string[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("status", "miembro");

  return (data ?? []).map((row) => row.user_id);
});

/** Fetches the current user's pending group invitations (`invitado` rows), most recent first. */
export const getMyGroupInvitations = cache(async (): Promise<GroupInvitation[]> => {
  const session = await verifySession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select(
      "id, group:groups!group_members_group_id_fkey(id, name), inviter:users!group_members_inviter_id_fkey(id, name, created_at)"
    )
    .eq("user_id", session.userId)
    .eq("status", "invitado")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .filter((row): row is typeof row & { group: Pick<Group, "id" | "name"> } => row.group !== null)
    .map((row) => ({
      membershipId: row.id,
      groupId: row.group.id,
      groupName: row.group.name,
      inviter: row.inviter,
    }));
});

/**
 * Resolves a group invite link's token to a read-only preview (name, owner,
 * member count) via the `group_preview_by_token` RPC, without joining.
 * Joining is a separate, explicit step (`joinGroupByToken`) — opening the
 * link itself must never have side effects (Next.js prefetch, link-preview
 * bots, etc.).
 */
export const getGroupPreviewByToken = cache(
  async (token: string): Promise<GroupPreview | null> => {
    const session = await verifySession();
    if (!session) return null;

    const supabase = await createClient();
    const { data } = await supabase.rpc("group_preview_by_token", { p_token: token });

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      ownerName: row.owner_name,
      memberCount: row.member_count,
    };
  }
);

/** Searches other users for the "invitar a este grupo" panel, tagging each with their relation to that group. Not memoized — dynamic, like `searchUsers`. */
export async function searchUsersForGroup(
  groupId: string,
  query: string
): Promise<GroupUserSearchResult[]> {
  const session = await verifySession();
  if (!session) return [];

  const results = await searchUsers(query);
  if (results.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("user_id, status")
    .eq("group_id", groupId)
    .in(
      "user_id",
      results.map((r) => r.id)
    );

  const relationByUserId = new Map<string, GroupRelation>();
  for (const row of data ?? []) {
    relationByUserId.set(row.user_id, row.status);
  }

  return results.map((r) => ({
    ...r,
    groupRelation: relationByUserId.get(r.id) ?? "ninguna",
  }));
}
