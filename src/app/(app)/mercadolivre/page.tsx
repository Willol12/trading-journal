import { headers } from "next/headers";
import Link from "next/link";
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-4">
      <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-profit" : "bg-muted"}`} />
      <div className="text-sm text-fg">{children}</div>
    </div>
  );
}

export default async function MercadoLivrePage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "trading-journal-seven-nu.vercel.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const callbackUrl = `${protocol}://${host}/oauth/mercadolivre/callback`;
  const clientConfigured = Boolean(process.env.MERCADOLIVRE_CLIENT_ID);
  const secretConfigured = Boolean(process.env.MERCADOLIVRE_CLIENT_SECRET);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Mercado Livre</h1>
        <p className="mt-1 text-sm text-muted">Configuracao da API oficial para o MonitorPrecos.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-profit" /> Callback HTTPS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Status ok><span className="font-medium">Rota publica separada do diario e pronta para cadastro.</span></Status>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">URI de redirect</label>
              <input value={callbackUrl} readOnly className="w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 font-mono text-xs text-fg" />
            </div>
            <Link href={callbackUrl} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
              Testar callback <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-accent" /> Credenciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Status ok={clientConfigured}>{clientConfigured ? "Client ID configurado na Vercel." : "Client ID ainda nao configurado."}</Status>
            <Status ok={secretConfigured}>{secretConfigured ? "Client Secret configurado com seguranca." : "Client Secret ainda nao configurado."}</Status>
            <p className="text-xs leading-relaxed text-muted">
              Os valores devem ser cadastrados como variaveis de ambiente na Vercel. O segredo nunca sera exibido nesta pagina nem enviado ao navegador.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-profit" /> Proximo passo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>Cadastre a URI acima no DevCenter e mantenha somente leitura para publicacoes e sincronizacao.</p>
          <p>O coletor de precos continuara local. A Vercel hospeda apenas esta interface e o retorno OAuth, sem executar scraping.</p>
          <Link href="https://developers.mercadolivre.com.br/devcenter" target="_blank" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            Abrir DevCenter <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
