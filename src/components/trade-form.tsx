"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney, fmtR, plColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/datetime-picker";
import { ScreenshotUpload } from "@/components/screenshot-upload";

export interface FormAccount {
  id: string;
  nome: string;
}
export interface FormInstrument {
  id: string;
  symbol: string;
  pointValue: number;
}
export interface FormSetup {
  id: string;
  nome: string;
}
export interface FormTag {
  id: string;
  nome: string;
  tipo: string;
}

export interface TradeInitial {
  accountId: string;
  instrumentId: string;
  dataHora: string;
  direcao: string;
  contratos: number;
  precoEntrada: number | null;
  precoStop: number | null;
  precoSaida: number | null;
  resultadoPontos: number | null;
  resultadoValor: number | null;
  riscoValor: number | null;
  rrPlanejado: number | null;
  comissoes: number;
  resultado: string;
  setupId: string | null;
  notas: string | null;
  tagIds: string[];
}

const labelCls = "mb-1 block text-xs text-muted";
const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent";

function parseNum(s: string): number | null {
  if (s == null || s.trim() === "") return null;
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

export function TradeForm({
  action,
  accounts,
  instruments,
  setups,
  tags,
  initial,
  defaultAccountId,
  tradeId,
  onDelete,
  userId,
  screenshotInitialPath,
  screenshotInitialUrl,
}: {
  action: (formData: FormData) => void;
  accounts: FormAccount[];
  instruments: FormInstrument[];
  setups: FormSetup[];
  tags: FormTag[];
  initial?: TradeInitial;
  defaultAccountId?: string;
  tradeId?: string;
  onDelete?: (formData: FormData) => void;
  userId: string;
  screenshotInitialPath?: string | null;
  screenshotInitialUrl?: string | null;
}) {
  const [instrumentId, setInstrumentId] = useState(
    initial?.instrumentId ??
      instruments.find((i) => i.symbol === "MNQ")?.id ??
      instruments[0]?.id ??
      "",
  );
  const [direcao, setDirecao] = useState(initial?.direcao ?? "long");
  const [contratos, setContratos] = useState(String(initial?.contratos ?? 1));
  const [pl, setPl] = useState(
    initial?.resultadoValor != null ? String(initial.resultadoValor) : "",
  );
  const [risco, setRisco] = useState(
    initial?.riscoValor != null ? String(initial.riscoValor) : "",
  );
  const [riscoUnidade, setRiscoUnidade] = useState<"usd" | "pontos">("usd");
  // preços (opcional)
  const [entrada, setEntrada] = useState(
    initial?.precoEntrada != null ? String(initial.precoEntrada) : "",
  );
  const [stop, setStop] = useState(
    initial?.precoStop != null ? String(initial.precoStop) : "",
  );
  const [saida, setSaida] = useState(
    initial?.precoSaida != null ? String(initial.precoSaida) : "",
  );

  const pv = instruments.find((i) => i.id === instrumentId)?.pointValue ?? 0;
  const nContratos = parseNum(contratos) ?? 1;
  const pe = parseNum(entrada);
  const ps = parseNum(stop);
  const px = parseNum(saida);

  // P&L efetivo: preços > P&L digitado
  const pontosPrecos =
    pe != null && px != null
      ? Number((direcao === "short" ? pe - px : px - pe).toFixed(2))
      : null;
  const plPrecos = pontosPrecos != null ? pontosPrecos * pv * nContratos : null;
  const plEff = plPrecos ?? parseNum(pl);

  // Risco efetivo: campo risco (US$/pontos) > entrada+stop
  const riscoInput = parseNum(risco);
  const riscoFromInput =
    riscoInput != null
      ? riscoUnidade === "pontos"
        ? riscoInput * pv * nContratos
        : riscoInput
      : null;
  const riscoFromPrices =
    pe != null && ps != null ? Math.abs(pe - ps) * pv * nContratos : null;
  const riscoEff = riscoFromInput ?? riscoFromPrices;

  const rEff = plEff != null && riscoEff && riscoEff > 0 ? plEff / riscoEff : null;

  const emocoes = tags.filter((t) => t.tipo === "emocao");
  const erros = tags.filter((t) => t.tipo === "erro");

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4 p-4">
        {/* Linha 1 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls}>Conta</label>
            <select
              name="accountId"
              defaultValue={initial?.accountId ?? defaultAccountId ?? accounts[0]?.id}
              className={inputCls}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ativo</label>
            <select
              name="instrumentId"
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              className={inputCls}
            >
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data / hora</label>
            <DateTimePicker name="dataHora" initial={initial?.dataHora} />
          </div>
          <div>
            <label className={labelCls}>Direção</label>
            <div className="flex gap-2">
              {(["long", "short"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirecao(d)}
                  className={cn(
                    "h-9 flex-1 rounded-lg border text-sm capitalize transition-colors",
                    direcao === d
                      ? d === "long"
                        ? "border-profit/40 bg-profit/15 text-profit"
                        : "border-loss/40 bg-loss/15 text-loss"
                      : "border-border bg-surface-2 text-muted",
                  )}
                >
                  {d === "long" ? "Long" : "Short"}
                </button>
              ))}
            </div>
            <input type="hidden" name="direcao" value={direcao} />
          </div>
          <div>
            <label className={labelCls}>Contratos</label>
            <input
              type="number"
              name="contratos"
              min={1}
              value={contratos}
              onChange={(e) => setContratos(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Resultado simples: P&L + Risco */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">
            Resultado — informe o P&amp;L (Net PNL) e o risco; o R é calculado
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>P&L US$ (Net PNL)</label>
              <input
                type="text"
                inputMode="decimal"
                name="resultadoValor"
                value={pl}
                onChange={(e) => setPl(e.target.value)}
                placeholder="ex.: 194 ou -50"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Risco</label>
              <input
                type="text"
                inputMode="decimal"
                name="risco"
                value={risco}
                onChange={(e) => setRisco(e.target.value)}
                placeholder={riscoUnidade === "usd" ? "ex.: 100" : "ex.: 10"}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Unidade do risco</label>
              <select
                name="riscoUnidade"
                value={riscoUnidade}
                onChange={(e) => setRiscoUnidade(e.target.value as "usd" | "pontos")}
                className={inputCls}
              >
                <option value="usd">US$</option>
                <option value="pontos">Pontos</option>
              </select>
            </div>
          </div>

          {/* Resumo ao vivo */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <LiveStat label="P&L" value={plEff != null ? fmtMoney(plEff, { signed: true }) : "—"} cls={plEff != null ? plColor(plEff) : "text-muted"} />
            <LiveStat label="Risco" value={riscoEff != null ? fmtMoney(riscoEff) : "—"} cls="text-fg" />
            <LiveStat label="R realizado" value={rEff != null ? fmtR(rEff) : "—"} cls={rEff != null ? plColor(rEff) : "text-muted"} />
          </div>
        </div>

        {/* Resultado + Setup */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Resultado</label>
            <select name="resultado" defaultValue={initial?.resultado ?? "auto"} className={inputCls}>
              <option value="auto">Automático (pelo P&L)</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="be">Breakeven</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Setup</label>
            <select name="setupId" defaultValue={initial?.setupId ?? ""} className={inputCls}>
              <option value="">—</option>
              {setups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TagGroup title="Emoção" tags={emocoes} initial={initial?.tagIds} />
          <TagGroup title="Erros" tags={erros} initial={initial?.tagIds} />
        </div>

        {/* Notas */}
        <div>
          <label className={labelCls}>Notas</label>
          <textarea
            name="notas"
            rows={3}
            defaultValue={initial?.notas ?? ""}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            placeholder="O que funcionou, o que melhorar..."
          />
        </div>

        {/* Print do trade (opcional) */}
        <div>
          <label className={labelCls}>Print do trade (opcional)</label>
          <ScreenshotUpload
            userId={userId}
            name="screenshotPath"
            initialPath={screenshotInitialPath}
            initialUrl={screenshotInitialUrl}
          />
        </div>

        {/* Opcional: calcular pelos preços */}
        <details className="rounded-lg border border-border bg-surface-2/40 p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            Calcular pelos preços (opcional)
          </summary>
          <p className="mt-2 mb-3 text-xs text-muted">
            Se preencher entrada e saída, o app calcula o P&amp;L pelos preços.
            Entrada + stop calculam o risco. Estes valores têm prioridade sobre os de cima.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Preço de entrada</label>
              <input type="text" inputMode="decimal" name="precoEntrada" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Preço do stop</label>
              <input type="text" inputMode="decimal" name="precoStop" value={stop} onChange={(e) => setStop(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Preço de saída</label>
              <input type="text" inputMode="decimal" name="precoSaida" value={saida} onChange={(e) => setSaida(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>R:R planejado</label>
              <input type="text" inputMode="decimal" name="rrPlanejado" defaultValue={initial?.rrPlanejado ?? ""} placeholder="ex.: 2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Comissões US$</label>
              <input type="text" inputMode="decimal" name="comissoes" defaultValue={initial?.comissoes ?? ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Resultado em pontos (manual)</label>
              <input type="text" inputMode="decimal" name="resultadoPontos" defaultValue={initial?.resultadoPontos ?? ""} className={inputCls} />
            </div>
          </div>
        </details>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {tradeId && onDelete && (
            <Button type="submit" variant="danger" size="sm" formAction={onDelete}>
              Excluir
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/trades">Cancelar</Link>
          </Button>
          <Button type="submit" size="sm">
            {tradeId ? "Salvar alterações" : "Salvar trade"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function LiveStat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={cn("tabular text-sm font-semibold", cls)}>{value}</div>
    </div>
  );
}

function TagGroup({
  title,
  tags,
  initial,
}: {
  title: string;
  tags: FormTag[];
  initial?: string[];
}) {
  return (
    <div>
      <label className={labelCls}>{title}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-fg has-[:checked]:border-accent has-[:checked]:bg-accent/15 has-[:checked]:text-accent"
          >
            <input
              type="checkbox"
              name="tagIds"
              value={t.id}
              defaultChecked={initial?.includes(t.id)}
              className="hidden"
            />
            {t.nome}
          </label>
        ))}
      </div>
    </div>
  );
}
