import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing target for Supabase auth emails (signup confirmation, password
 * recovery, etc), set via `emailRedirectTo` in `app/actions/auth.ts`.
 *
 * The project has no custom SMTP configured, so the email templates
 * (including "Confirm signup") can't be edited in the dashboard and still
 * use the default `{{ .ConfirmationURL }}` link. That link hits Supabase's
 * hosted `/auth/v1/verify` endpoint, which verifies the token server-side
 * and then redirects the browser to `redirect_to` — since the client here
 * uses the default `flowType: "pkce"` (see `lib/supabase/server.ts`), that
 * redirect carries a `?code=` param instead of hash-fragment tokens, so a
 * plain Route Handler can pick it up and exchange it for a session that
 * lands in cookies (`exchangeCodeForSession`). `token_hash`/`type` are kept
 * as a fallback for the OTP-link pattern, in case the email template is
 * ever customized to use `{{ .TokenHash }}` directly (requires SMTP).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    // Supabase's /verify already confirmed the email (or validated the
    // recovery token) before redirecting here with `code` — that part
    // succeeded regardless of this exchange. A failure at this step means
    // the `code_verifier` cookie from the browser that started the flow
    // isn't present (most commonly: the email link was opened in a
    // different browser/app than the one used to sign up), not that the
    // link itself was invalid or expired — so this doesn't get the
    // "invalid or expired" message below, just a plain redirect to login.
    redirect("/login");
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  }

  redirect("/login?error=confirmacion");
}
