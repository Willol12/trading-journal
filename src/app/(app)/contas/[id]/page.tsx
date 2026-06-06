import { notFound } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { updateAccount, deleteAccount } from "../actions";
import { getAccount } from "@/lib/data";

export default async function EditContaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getAccount(id);
  if (!a) notFound();

  const update = updateAccount.bind(null, id);
  const del = deleteAccount.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Editar conta</h1>
      <AccountForm
        action={update}
        onDelete={del}
        accountId={id}
        initial={{
          nome: a.nome,
          firm: a.firm,
          tamanho: a.tamanho,
          tipo: a.tipo,
          saldoInicial: a.saldoInicial,
          metaProfit: a.metaProfit,
          limitePerdaDiario: a.limitePerdaDiario,
          maxDrawdown: a.maxDrawdown,
          tipoDrawdown: a.tipoDrawdown,
          consistenciaPct: a.consistenciaPct,
          minDiasTrade: a.minDiasTrade,
          ativa: a.ativa,
        }}
      />
    </div>
  );
}
