import { ImportWizard } from "@/components/import-wizard";
import { getAccounts } from "@/lib/data";

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const sp = await searchParams;
  const accounts = await getAccounts();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-fg">Importar CSV</h1>
        <p className="text-xs text-muted">
          Importe o histórico de trades exportado do NinjaTrader 8.
        </p>
      </div>
      <ImportWizard
        accounts={accounts.map((a) => ({ id: a.id, nome: a.nome }))}
        defaultAccountId={sp.conta}
      />
    </div>
  );
}
