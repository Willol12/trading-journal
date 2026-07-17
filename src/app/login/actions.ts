"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function backToLogin(message: string): never {
  redirect("/login?error=" + encodeURIComponent(message));
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) backToLogin("Preencha email e senha.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) backToLogin(error.message);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) backToLogin("Preencha email e senha.");
  if (password.length < 6) backToLogin("A senha precisa ter ao menos 6 caracteres.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) backToLogin(error.message);

  // Se a confirmação de email estiver LIGADA, não há sessão ainda.
  if (!data.session) {
    redirect("/login?message=" + encodeURIComponent("Conta criada! Confira seu email para confirmar e depois entre."));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function magicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) backToLogin("Preencha seu email para receber o link de acesso.");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) backToLogin("Nao foi possivel identificar o endereco do aplicativo.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${protocol}://${host}/auth/confirm?next=/`,
    },
  });
  if (error) backToLogin(error.message);

  redirect(
    "/login?message=" +
      encodeURIComponent("Link enviado. Abra seu email e toque em Entrar."),
  );
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
