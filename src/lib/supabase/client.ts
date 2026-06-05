import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso no NAVEGADOR (componentes client).
// Usa a publishable key (segura para o browser — protegida por RLS no futuro).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
