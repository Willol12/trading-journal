"use server";

import { revalidatePath } from "next/cache";
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

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
