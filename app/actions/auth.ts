"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  ForgotPasswordSchema,
  type ForgotPasswordState,
  LoginFormSchema,
  type LoginFormState,
  ResetPasswordSchema,
  type ResetPasswordState,
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

  // Con "email enumeration protection" activada, un email ya registrado no
  // produce error: Supabase devuelve un usuario ofuscado con identities
  // vacías y reenvía un correo. Lo tratamos como cuenta existente (una sola
  // cuenta por correo).
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      message: "Ya existe una cuenta con ese email. Inicia sesión o restablece tu contraseña.",
    };
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

export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email } = validatedFields.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=/restablecer` : undefined,
  });

  // Always report success regardless of whether the email is registered —
  // otherwise this endpoint becomes an account-existence oracle.
  return {
    success: true,
    message: "Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.",
  };
}

export async function updatePassword(
  _state: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { password } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { message: translateAuthError(error.message) };
  }

  redirect("/");
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
