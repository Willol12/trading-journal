import { login, signup } from "./actions";
import { Reveal } from "@/components/ui/reveal";
import { EquityCurveDeco } from "@/components/equity-curve-deco";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  const inputCls =
    "w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-sm text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-muted/60";

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca (esquerda) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-accent-2 font-display text-lg font-bold text-white shadow-[var(--glow-accent)]">
            T
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">
            Trading Journal
          </span>
        </div>

        <div className="max-w-md">
          <Reveal delay={0.1}>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
              Opere com{" "}
              <span className="bg-gradient-to-r from-profit to-accent bg-clip-text text-transparent">
                clareza
              </span>
              , não no escuro.
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Registre cada trade, veja seus números de verdade e descubra onde
              você ganha — e onde sangra. O diário que mede, não promete.
            </p>
          </Reveal>
          <div className="mt-8 h-28 w-full max-w-sm">
            <EquityCurveDeco className="h-full w-full" />
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted">
          <span>P&amp;L · Win rate · Profit factor</span>
          <span>R-múltiplo · Drawdown</span>
        </div>
      </div>

      {/* Painel de autenticação (direita) */}
      <div className="flex min-h-screen items-center justify-center p-6">
        <Reveal className="w-full max-w-sm">
          <div className="surface-card rounded-[var(--radius)] border border-border p-8 shadow-[var(--shadow-elevated)]">
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-accent-2 font-display text-lg font-bold text-white">
                  T
                </div>
                <span className="font-display text-sm font-semibold">Trading Journal</span>
              </div>
            </div>

            <h2 className="font-display text-xl font-semibold tracking-tight">
              Entrar na sua conta
            </h2>
            <p className="mt-1 text-xs text-muted">
              Bem-vindo de volta — ou crie sua conta em segundos.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-lg border border-profit/30 bg-profit/10 px-3 py-2 text-sm text-profit">
                {message}
              </div>
            )}

            <form className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputCls}
                  placeholder="voce@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>

              <button
                formAction={login}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-b from-accent to-[color-mix(in_srgb,var(--color-accent)_80%,var(--color-accent-2))] text-sm font-semibold text-white shadow-[var(--glow-accent)] transition duration-200 hover:brightness-110 active:scale-[0.99]"
              >
                Entrar
              </button>
              <button
                formAction={signup}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-surface-2/60 text-sm font-medium text-fg transition duration-200 hover:bg-surface-2 active:scale-[0.99]"
              >
                Criar conta
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
