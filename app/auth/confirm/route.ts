import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing target for Supabase auth emails (signup confirmation, password
 * recovery, etc). Exchanges the `token_hash` for a session server-side so
 * the SSR cookie client (lib/supabase/server.ts) sees it on the next
 * request — the hash-fragment tokens from Supabase's default hosted
 * `/auth/v1/verify` redirect never reach the server, so this route must be
 * the target configured in the Supabase email templates (see
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=confirmacion");
}
