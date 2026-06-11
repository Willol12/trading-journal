"use client";

import { useState } from "react";
import { GitCompareArrows, Plus, Trash2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/money";
import {
  compareScenarios,
  requiredWinRate,
  breakevenWinRateUsd,
  type ScenarioInput,
  type ScenarioResult,
} from "@/lib/simulator";
import { fmtNumber, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JournalData } from "./types";
import { MesaForm, mesaDefault, mesaToRules, type MesaFormState } from "./mesa-form";
import { ModelForm, modelDefault, modelToTradeModel, type ModelFormState } from "./model-form";
import { ParamsForm, paramsDefault, paramsToSimParams, type ParamsFormState } from "./params-form";
import { PassBustChart } from "./sim-charts";
import { usePersistedState } from "./use-local-storage";
import { inputCls } from "./fields";

interface ScenarioState {
  id: string;
  nome: string;
  model: ModelFormState;
}

// Os 3 ATMs do usuário pré-carregados. Win rates default só como ponto de
// partida didático (alvo mais longe = acerto menor) — o usuário edita.
function defaultScenarios(): ScenarioState[] {
  return [
    { id: "atm-1x3", nome: "1x3", model: modelDefault("1x3", "40") },
    { id: "atm-1x2", nome: "1x2", model: modelDefault("1x2", "48") },
    { id: "atm-1x1", nome: "1x1", model: modelDefault("1x1", "58") },
  ];
}

interface WrRow {
  nome: string;
  breakeven: number;
  wr50: number | null;
  wr80: number | null;
  wr90: number | null;
}

export function Comparador({ journal }: { journal: JournalData }) {
  const [mesa, setMesa] = usePersistedState<MesaFormState>("comp-mesa", () =>
    mesaDefault(journal.mesaPrefill),
  );
  const [scenarios, setScenarios] = usePersistedState<ScenarioState[]>(
    "comp-scenarios",
    defaultScenarios,
  );
  const [params, setParams] = usePersistedState<ParamsFormState>(
    "comp-params",
    paramsDefault,
  );
  const [running, setRunning] = useState(false);
  const [runningWr, setRunningWr] = useState(false);
  const [results, setResults] = useState<ScenarioResult[] | null>(null);
  const [wrRows, setWrRows] = useState<WrRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function buildInputs(): { rules: ReturnType<typeof mesaToRules>; inputs: ScenarioInput[]; pulados: string[] } {
    const rules = mesaToRules(mesa);
    const inputs: ScenarioInput[] = [];
    const pulados: string[] = [];
    for (const s of scenarios) {
      const tm = modelToTradeModel(s.model, journal.outcomes);
      if (tm) inputs.push({ nome: s.nome || s.id, model: tm });
      else pulados.push(s.nome || s.id);
    }
    return { rules, inputs, pulados };
  }

  function onComparar() {
    const { rules, inputs, pulados } = buildInputs();
    if (!rules) {
      setErro("Preencha saldo inicial e meta de lucro da mesa.");
      return;
    }
    if (inputs.length === 0) {
      setErro("Nenhum gerenciamento válido pra comparar.");
      return;
    }
    setErro(pulados.length > 0 ? `Pulados (inválidos): ${pulados.join(", ")}.` : null);
    setRunning(true);
    setTimeout(() => {
      try {
        setResults(compareScenarios(rules, inputs, paramsToSimParams(params)));
      } finally {
        setRunning(false);
      }
    }, 30);
  }

  function onWrNecessario() {
    const rules = mesaToRules(mesa);
    if (!rules) {
      setErro("Preencha saldo inicial e meta de lucro da mesa.");
      return;
    }
    setErro(null);
    setRunningWr(true);
    setTimeout(() => {
      try {
        const base = paramsToSimParams(params);
        const rows: WrRow[] = [];
        for (const s of scenarios) {
          const tm = modelToTradeModel(s.model, journal.outcomes);
          if (tm?.kind !== "parametric") continue; // só faz sentido no paramétrico
          const p = { ...base, nRuns: 2000, pathSampleSize: 1 };
          rows.push({
            nome: s.nome || s.id,
            breakeven: breakevenWinRateUsd(tm.riskUsd, tm.targetUsd, tm.commissionUsd),
            wr50: requiredWinRate(rules, tm, 0.5, p),
            wr80: requiredWinRate(rules, tm, 0.8, p),
            wr90: requiredWinRate(rules, tm, 0.9, p),
          });
        }
        setWrRows(rows);
      } finally {
        setRunningWr(false);
      }
    }, 30);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Regras da mesa (iguais pra todos os cenários)</CardTitle>
        </CardHeader>
        <CardContent>
          <MesaForm
            value={mesa}
            onChange={setMesa}
            prefill={journal.mesaPrefill}
            contaNome={journal.contaNome}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamentos</CardTitle>
          <span className="ml-auto text-xs text-muted">
            edite o win rate de cada um com a SUA estimativa
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="space-y-3 rounded-lg border border-border/60 bg-surface-2/30 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={s.nome}
                  onChange={(e) =>
                    setScenarios(
                      scenarios.map((x) =>
                        x.id === s.id ? { ...x, nome: e.target.value } : x,
                      ),
                    )
                  }
                  className={cn(inputCls, "h-8 w-40 text-xs font-medium")}
                  placeholder="nome"
                />
                <button
                  type="button"
                  onClick={() => setScenarios(scenarios.filter((x) => x.id !== s.id))}
                  className="ml-auto rounded-md p-1.5 text-muted transition-colors hover:bg-loss/10 hover:text-loss"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ModelForm
                value={s.model}
                onChange={(m) =>
                  setScenarios(
                    scenarios.map((x) => (x.id === s.id ? { ...x, model: m } : x)),
                  )
                }
                journal={journal}
                compact
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setScenarios([
                  ...scenarios,
                  {
                    id: `s-${Date.now()}`,
                    nome: `Cenário ${scenarios.length + 1}`,
                    model: modelDefault("1x3", "40"),
                  },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar gerenciamento
            </Button>
            {scenarios.length === 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setScenarios(defaultScenarios())}>
                Restaurar 1x3 / 1x2 / 1x1
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ParamsForm value={params} onChange={setParams} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onComparar} disabled={running || runningWr}>
              <GitCompareArrows className="h-3.5 w-3.5" />
              {running ? "Comparando…" : "Comparar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onWrNecessario}
              disabled={running || runningWr}
            >
              {runningWr ? "Calculando…" : "WR necessário"}
            </Button>
            {erro && <span className="text-xs text-loss">{erro}</span>}
          </div>
        </CardContent>
      </Card>

      {results && results.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ranking</CardTitle>
              <span className="ml-auto text-xs text-muted">
                {fmtNumber(results[0].nRuns, 0)} simulações por cenário
              </span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr>
                      {[
                        "Gerenciamento",
                        "Aprovação",
                        "Eliminação",
                        "Dias (mediana)",
                        "Seca p95",
                        "Tentativas esp.",
                        "Custo esp.",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border-b border-border px-2 py-2 text-left font-medium text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.nome} className={cn(i === 0 && "bg-accent/6")}>
                        <td className="border-b border-border/50 px-2 py-2 font-medium text-fg">
                          <span className="flex items-center gap-1.5">
                            {r.nome}
                            {i === 0 && (
                              <Badge variant="accent">
                                <Trophy className="mr-0.5 h-3 w-3" /> melhor
                              </Badge>
                            )}
                          </span>
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-profit">
                          {fmtPct(r.passProb * 100, 1)}
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-loss">
                          {fmtPct(r.bustProb * 100, 1)}
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-fg">
                          {r.daysToPass.p50 != null ? fmtNumber(r.daysToPass.p50, 0) : "—"}
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-fg">
                          {r.maxLossStreak.p95}×
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-fg">
                          {r.expectedAttempts != null ? fmtNumber(r.expectedAttempts, 1) : "∞"}
                        </td>
                        <td className="border-b border-border/50 px-2 py-2 font-mono text-fg">
                          {r.expectedCostUsd != null ? <Money usd={r.expectedCostUsd} /> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                &quot;Melhor&quot; = maior probabilidade de aprovação COM os win
                rates informados — confirme os seus no diário antes de confiar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aprovação × eliminação</CardTitle>
            </CardHeader>
            <CardContent>
              <PassBustChart
                data={results.map((r) => ({
                  nome: r.nome,
                  pass: r.passProb,
                  bust: r.bustProb,
                  timeout: r.timeoutProb,
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}

      {wrRows && wrRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Win rate necessário</CardTitle>
            <span className="ml-auto text-xs text-muted">
              pra cada nível de segurança nesta mesa
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr>
                    {["Gerenciamento", "WR breakeven", "p/ 50%", "p/ 80%", "p/ 90%"].map(
                      (h) => (
                        <th
                          key={h}
                          className="border-b border-border px-2 py-2 text-left font-medium text-muted"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {wrRows.map((r) => (
                    <tr key={r.nome}>
                      <td className="border-b border-border/50 px-2 py-2 font-medium text-fg">
                        {r.nome}
                      </td>
                      <td className="border-b border-border/50 px-2 py-2 font-mono text-muted">
                        {fmtPct(r.breakeven * 100, 1)}
                      </td>
                      {[r.wr50, r.wr80, r.wr90].map((v, i) => (
                        <td
                          key={i}
                          className="border-b border-border/50 px-2 py-2 font-mono text-fg"
                        >
                          {v != null ? fmtPct(v * 100, 1) : "inalcançável"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Seu win rate real precisa estar ACIMA da coluna escolhida. Entre o
              breakeven e a coluna de 50% você tem edge, mas a variância ainda
              reprova com frequência.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
