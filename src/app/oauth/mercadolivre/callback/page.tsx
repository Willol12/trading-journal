import Image from "next/image";
import { MercadoLivreCallbackCode } from "@/components/mercadolivre-callback-code";

export const metadata = {
  title: "Mercado Livre | MonitorPrecos",
  description: "Retorno seguro da integracao do MonitorPrecos com o Mercado Livre.",
};

export default async function MercadoLivreCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
  }>;
}) {
  const { code, error, error_description: errorDescription } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-surface/80 p-7 shadow-[var(--shadow-elevated)] backdrop-blur sm:p-10">
        <Image
          src="/monitorprecos-logo.png"
          alt="MonitorPrecos"
          width={72}
          height={72}
          className="rounded-2xl"
          priority
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-profit">
          MonitorPrecos
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg">
          {error
            ? "Autorizacao nao concluida"
            : code
              ? "Autorizacao recebida"
              : "Callback do Mercado Livre ativo"}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          {error
            ? errorDescription || "O Mercado Livre devolveu um erro. Volte ao aplicativo e tente novamente."
            : code
              ? "Copie o codigo temporario e volte ao aplicativo local para concluir a integracao."
              : "Este endereco HTTPS esta pronto para receber retornos da integracao. Nenhuma senha ou informacao de pagamento e solicitada aqui."}
        </p>
        {code && <MercadoLivreCallbackCode code={code} />}
        <div className="mt-7 flex items-center gap-2 text-sm text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-profit shadow-[0_0_14px_var(--color-profit)]" />
          Endpoint disponivel
        </div>
      </section>
    </main>
  );
}
