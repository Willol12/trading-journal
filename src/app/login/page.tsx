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
    "w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-muted/60 xl:py-3 xl:text-base";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Reveal className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-surface/50 shadow-[var(--shadow-elevated)] backdrop-blur-sm lg:grid-cols-2">
          {/* Painel de marca (esquerda) — centralizado verticalmente */}
          <div className="relative hidden flex-col justify-center gap-7 border-r border-border/60 p-12 lg:flex xl:p-14">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-accent-2 font-display text-lg font-bold text-white shadow-[var(--glow-accent)]">
                T
              </div>
              <span className="font-display text-base font-semibold tracking-tight">
                Trading Journal
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
              Opere com{" "}
              <span className="bg-gradient-to-r from-profit to-accent bg-clip-text text-transparent">
                clareza
              </span>
              , não no escuro.
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-muted xl:text-base">
              Registre cada trade, veja seus números de verdade e descubra onde
              você ganha — e onde sangra. O diário que mede, não promete.
            </p>

            <div className="h-28 w-full max-w-md xl:h-32">
              <EquityCurveDeco className="h-full w-full" />
            </div>

            <div className="text-xs text-muted">
              P&amp;L · Win rate · Profit factor · R-múltiplo · Drawdown
            </div>
          </div>

          {/* Painel de autenticação (direita) — centralizado verticalmente */}
          <div className="flex flex-col justify-center p-8 sm:p-10 xl:p-14">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-accent-2 font-display text-lg font-bold text-white">
                T
              </div>
              <span className="font-display text-sm font-semibold">Trading Journal</span>
            </div>

            <h2 className="font-display text-2xl font-semibold tracking-tight xl:text-3xl">
              Entrar na sua conta
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Bem-vindo de volta — ou crie sua conta em segundos.
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-5 rounded-lg border border-profit/30 bg-profit/10 px-3 py-2 text-sm text-profit">
                {message}
              </div>
            )}

            <form className="mt-7 space-y-5">
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
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-accent to-[color-mix(in_srgb,var(--color-accent)_80%,var(--color-accent-2))] text-sm font-semibold text-white shadow-[var(--glow-accent)] transition duration-200 hover:brightness-110 active:scale-[0.99] xl:text-base"
              >
                Entrar
              </button>
              <button
                formAction={signup}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-surface-2/60 text-sm font-medium text-fg transition duration-200 hover:bg-surface-2 active:scale-[0.99] xl:text-base"
              >
                Criar conta
              </button>
            </form>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
