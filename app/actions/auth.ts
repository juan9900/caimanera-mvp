"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  LoginFormSchema,
  type LoginFormState,
  SignupFormSchema,
  type SignupFormState,
} from "@/lib/auth/definitions";

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { inviteCode, email, password } = validatedFields.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invite_code: inviteCode },
      emailRedirectTo: origin ? `${origin}/auth/confirm?next=/onboarding` : undefined,
    },
  });

  if (error) {
    return { message: translateAuthError(error.message) };
  }

  if (!data.session) {
    return {
      success: true,
      message: "Revisa tu email para confirmar la cuenta antes de continuar.",
    };
  }

  redirect("/onboarding");
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: translateAuthError(error.message) };
  }

  const next = formData.get("next");
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  redirect(safeNext);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function translateAuthError(message: string): string {
  if (message.includes("invitación") || message.includes("invitation")) {
    return message;
  }
  if (message.includes("already registered")) {
    return "Ya existe una cuenta con ese email.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  return message;
}
