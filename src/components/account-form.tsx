"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROP_FIRMS, getTemplate } from "@/lib/propFirms";

export interface AccountInitial {
  nome: string;
  firm: string | null;
  tamanho: string | null;
  tipo: string;
  saldoInicial: number;
  metaProfit: number | null;
  limitePerdaDiario: number | null;
  maxDrawdown: number | null;
  tipoDrawdown: string;
  consistenciaPct: number | null;
  minDiasTrade: number | null;
  ativa: boolean;
}

const labelCls = "mb-1 block text-xs text-muted";
const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent";

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

export function AccountForm({
  action,
  initial,
  accountId,
  onDelete,
}: {
  action: (formData: FormData) => void;
  initial?: AccountInitial;
  accountId?: string;
  onDelete?: (formData: FormData) => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [firm, setFirm] = useState(initial?.firm ?? "");
  const [tamanho, setTamanho] = useState(initial?.tamanho ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "eval");
  const [saldoInicial, setSaldoInicial] = useState(s(initial?.saldoInicial));
  const [metaProfit, setMetaProfit] = useState(s(initial?.metaProfit));
  const [limiteDiario, setLimiteDiario] = useState(s(initial?.limitePerdaDiario));
  const [maxDrawdown, setMaxDrawdown] = useState(s(initial?.maxDrawdown));
  const [tipoDrawdown, setTipoDrawdown] = useState(initial?.tipoDrawdown ?? "trailing");
  const [consistencia, setConsistencia] = useState(s(initial?.consistenciaPct));
  const [minDias, setMinDias] = useState(s(initial?.minDiasTrade));
  const [ativa, setAtiva] = useState(initial?.ativa ?? true);

  const firmObj = PROP_FIRMS.find((f) => f.key === firm);
  const tamanhos = firmObj?.planos.map((p) => p.tamanho) ?? [];

  function applyTemplate(fk: string, tm: string) {
    const tpl = getTemplate(fk, tm);
    if (!tpl) return;
    const firmName = PROP_FIRMS.find((f) => f.key === fk)?.nome ?? "";
    if (!nome || nome === "Conta") setNome(`${firmName} ${tm}`);
    setSaldoInicial(s(tpl.saldoInicial));
    setMetaProfit(s(tpl.metaProfit));
    setLimiteDiario(s(tpl.limitePerdaDiario));
    setMaxDrawdown(s(tpl.maxDrawdown));
    setTipoDrawdown(tpl.tipoDrawdown);
    setConsistencia(s(tpl.consistenciaPct));
    setMinDias(s(tpl.minDiasTrade));
  }

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4 p-4">
        {/* Mesa / template */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Prop firm</label>
            <select
              name="firm"
              value={firm}
              onChange={(e) => {
                setFirm(e.target.value);
                setTamanho("");
              }}
              className={inputCls}
            >
              <option value="">Personalizada</option>
              {PROP_FIRMS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tamanho</label>
            <select
              name="tamanho"
              value={tamanho}
              onChange={(e) => {
                setTamanho(e.target.value);
                if (firm && e.target.value) applyTemplate(firm, e.target.value);
              }}
              disabled={!firm}
              className={inputCls}
            >
              <option value="">—</option>
              {tamanhos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="eval">Avaliação (eval)</option>
              <option value="funded">Funded</option>
              <option value="real">Real</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </div>

        {firm && (
          <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-xs text-warn">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Valores são uma semente do template (jun/2026). Regras variam por
              tipo de conta e mudam com frequência — confirme no site da mesa.
            </span>
          </div>
        )}

        <div>
          <label className={labelCls}>Nome da conta</label>
          <input
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="ex.: Lucid 25k Eval"
            className={inputCls}
          />
        </div>

        {/* Regras */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Saldo inicial US$" name="saldoInicial" value={saldoInicial} set={setSaldoInicial} />
          <Field label="Meta de profit US$" name="metaProfit" value={metaProfit} set={setMetaProfit} />
          <Field label="Limite diário US$" name="limitePerdaDiario" value={limiteDiario} set={setLimiteDiario} />
          <Field label="Max drawdown US$" name="maxDrawdown" value={maxDrawdown} set={setMaxDrawdown} />
          <div>
            <label className={labelCls}>Tipo de drawdown</label>
            <select
              name="tipoDrawdown"
              value={tipoDrawdown}
              onChange={(e) => setTipoDrawdown(e.target.value)}
              className={inputCls}
            >
              <option value="trailing">Trailing</option>
              <option value="eod">EOD (fim de dia)</option>
              <option value="static">Estático</option>
              <option value="intraday">Intraday</option>
            </select>
          </div>
          <Field label="Consistência %" name="consistenciaPct" value={consistencia} set={setConsistencia} />
          <Field label="Mín. dias de trade" name="minDiasTrade" value={minDias} set={setMinDias} />
        </div>

        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="ativa"
            checked={ativa}
            onChange={(e) => setAtiva(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Conta ativa
        </label>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {accountId && onDelete && (
            <Button type="submit" variant="danger" size="sm" formAction={onDelete}>
              Excluir conta
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/contas">Cancelar</Link>
          </Button>
          <Button type="submit" size="sm">
            {accountId ? "Salvar" : "Criar conta"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  set,
}: {
  label: string;
  name: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="text"
        inputMode="decimal"
        name={name}
        value={value}
        onChange={(e) => set(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}
