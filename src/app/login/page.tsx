import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-bold text-white">
            P
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Trading Journal</div>
            <div className="text-xs text-fg/50">Entre na sua conta</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-fg/60">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-fg/60">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Entrar
          </button>
          <button
            formAction={signup}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-fg/80 transition hover:bg-white/5"
          >
            Criar conta
          </button>
        </form>
      </div>
    </div>
  );
}
