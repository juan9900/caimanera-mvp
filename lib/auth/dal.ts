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
