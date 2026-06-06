import { createClient } from "@/lib/supabase/server";

// Retorna o id do usuário logado (claim `sub` = auth.users.id no Supabase).
// As rotas em (app) são protegidas pelo proxy, então aqui sempre deve haver usuário.
// Se não houver, lançamos — nunca devolver dado sem dono.
export async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Não autenticado: nenhuma sessão válida.");
  }
  return userId;
}
