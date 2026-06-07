import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Retorna o id do usuário logado (claim `sub` = auth.users.id no Supabase).
// Envolvido em cache() do React: é chamado em várias funções de dados no mesmo
// request — assim a validação do token roda só 1x por request.
export const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Não autenticado: nenhuma sessão válida.");
  }
  return userId;
});
