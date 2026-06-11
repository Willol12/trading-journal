"use client";

import { useState } from "react";
import {
  Clock,
  DollarSign,
  Play,
  Repeat,
  ShieldAlert,
  Snowflake,
  Target,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import {
  simulate,
  breakevenWinRateUsd,
  riskOfRuin,
  type SimResult,
  type SimMesaRules,
} from "@/lib/simulator";
import { fmtNumber, fmtPct } from "@/lib/format";
import { EquityBandChart, EquityHistChart, StreakChart } from "./sim-charts";
import type { JournalData } from "./types";
import { MesaForm, mesaDefault, mesaToRules, type MesaFormState } from "./mesa-form";
import { ModelForm, modelDefault, modelToTradeModel, type ModelFormState } from "./model-form";
import { ParamsForm, paramsDefault, paramsToSimParams, type ParamsFormState } from "./params-form";
import { usePersistedState } from "./use-local-storage";

export function Simulador({ journal }: { journal: JournalData }) {
  const [mesa, setMesa] = usePersistedState<MesaFormState>("sim-mesa", () =>
    mesaDefault(journal.mesaPrefill),
  );
  const [model, setModel] = usePersistedState<ModelFormState>("sim-model", () =>
    modelDefault(),
  );
  const [params, setParams] = usePersistedState<ParamsFormState>(
    "sim-params",
    paramsDefault,
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [baseline, setBaseline] = useState<SimResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const rules = mesaToRules(mesa);

  function onSimular() {
    const r = mesaToRules(mesa);
    const tm = modelToTradeModel(model, journal.outcomes);
    if (!r) {
      setErro("Preencha saldo inicial e meta de lucro da mesa.");
      return;
    }
    if (!tm) {
      setErro("Modelo de trade inválido — confira stop, alvo e contratos.");
      return;
    }
    setErro(null);
    setRunning(true);
    // setTimeout garante o repaint do botão antes do cálculo síncrono
    setTimeout(() => {
      try {
        const sp = paramsToSimParams(params); // mesma seed pros dois cenários
        setResult(simulate(r, tm, sp));
        // com tilt ligado, roda o "você disciplinado" pra mostrar o preço do tilt
        setBaseline(
          tm.kind === "parametric" && tm.psyche
            ? simulate(r, { ...tm, psyche: null }, sp)
            : null,
        );
      } finally {
        setRunning(false);
      }
    }, 30);
  }

  // Sanity-check analítico (só faz sentido no modo paramétrico)
  const tm = modelToTradeModel(model, journal.outcomes);
  let sanity: string | null = null;
  if (tm?.kind === "parametric" && rules) {
    const beWr = breakevenWinRateUsd(tm.riskUsd, tm.targetUsd, tm.commissionUsd);
    let texto = `WR de breakeven (c/ custos): ${fmtPct(beWr * 100, 1)}`;
    if (rules.maxDrawdown != null && tm.riskUsd > 0) {
      const vidas = rules.maxDrawdown / tm.riskUsd;
      const ror = riskOfRuin(tm.winRate, tm.targetUsd / tm.riskUsd, vidas);
      texto += ` · Risco de ruína teórico (DD estático, sem meta): ${fmtPct(ror * 100, 1)}`;
    }
    sanity = texto;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Regras da mesa</CardTitle>
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
          <CardTitle>Modelo de trade</CardTitle>
        </CardHeader>
        <CardContent>
          <ModelForm value={model} onChange={setModel} journal={journal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros da simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ParamsForm value={params} onChange={setParams} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onSimular} disabled={running}>
              <Play className="h-3.5 w-3.5" />
              {running ? "Simulando…" : "Simular"}
            </Button>
            {erro && <span className="text-xs text-loss">{erro}</span>}
            {result && !running && (
              <span className="text-xs text-muted">
                {fmtNumber(result.nRuns, 0)} simulações em{" "}
                {fmtNumber(result.elapsedMs, 0)} ms
              </span>
            )}
          </div>
          {sanity && <p className="text-xs text-muted">{sanity}</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Prob. de aprovação"
              tone={result.passProb >= 0.7 ? "profit" : "accent"}
              icon={<Target className="h-4 w-4" />}
              value={fmtPct(result.passProb * 100, 1)}
            />
            <StatCard
              label="Prob. de eliminação"
              tone="loss"
              icon={<ShieldAlert className="h-4 w-4" />}
              value={fmtPct(result.bustProb * 100, 1)}
            />
            <StatCard
              label="Sem resolução"
              icon={<Timer className="h-4 w-4" />}
              value={fmtPct(result.timeoutProb * 100, 1)}
              sub="nem meta, nem eliminação"
            />
            <StatCard
              label="Dias até aprovar"
              icon={<Clock className="h-4 w-4" />}
              value={
                result.daysToPass.p50 != null
                  ? `${fmtNumber(result.daysToPass.p50, 0)}`
                  : "—"
              }
              sub={
                result.daysToPass.p25 != null && result.daysToPass.p75 != null
                  ? `p25–p75: ${fmtNumber(result.daysToPass.p25, 0)}–${fmtNumber(result.daysToPass.p75, 0)}`
                  : "ninguém passou"
              }
            />
            <StatCard
              label="Tentativas esperadas"
              icon={<Repeat className="h-4 w-4" />}
              value={
                result.expectedAttempts != null
                  ? fmtNumber(result.expectedAttempts, 1)
                  : "∞"
              }
              sub="até passar uma vez"
            />
            {result.expectedCostUsd != null ? (
              <StatCard
                label="Custo esperado"
                icon={<DollarSign className="h-4 w-4" />}
                value={<Money usd={result.expectedCostUsd} />}
                sub="taxas até aprovar"
              />
            ) : (
              <StatCard
                label="Seca máxima (p95)"
                tone="loss"
                icon={<Snowflake className="h-4 w-4" />}
                value={`${result.maxLossStreak.p95}×`}
                sub="perdas seguidas"
              />
            )}
          </div>

          {result.tiltStats && baseline && (
            <Card>
              <CardHeader>
                <CardTitle>O preço do tilt</CardTitle>
                <span className="ml-auto text-xs text-muted">
                  mesma seed: você disciplinado × você em tilt
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard
                    label="Aprovação disciplinado"
                    tone="profit"
                    value={fmtPct(baseline.passProb * 100, 1)}
                  />
                  <StatCard
                    label="Aprovação com tilt"
                    tone={result.passProb < baseline.passProb ? "loss" : "neutral"}
                    value={fmtPct(result.passProb * 100, 1)}
                    sub={`${fmtNumber((result.passProb - baseline.passProb) * 100, 1)} pontos`}
                  />
                  <StatCard
                    label="Runs que entraram em tilt"
                    tone="accent"
                    value={fmtPct(result.tiltStats.runsComTilt * 100, 0)}
                  />
                  <StatCard
                    label="P&L médio em tilt"
                    tone={result.tiltStats.plTiltMedio < 0 ? "loss" : "profit"}
                    value={<Money usd={result.tiltStats.plTiltMedio} signed />}
                    sub="por tentativa que tiltou"
                  />
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  O delta entre as duas aprovações é o que a indisciplina custa —
                  e o que regras tipo &quot;parei após N perdas&quot; compram de
                  volta (teste ligando o disjuntor).
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Curva de equity — banda p10–p90 e mediana</CardTitle>
                <span className="ml-auto text-xs text-muted">
                  linhas finas = trajetórias reais sorteadas
                </span>
              </CardHeader>
              <CardContent>
                <EquityBandWrapper result={result} rules={rules} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Onde os runs terminam</CardTitle>
                <span className="ml-auto text-xs text-muted">equity final</span>
              </CardHeader>
              <CardContent>
                <EquityHistWrapper result={result} rules={rules} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Maior sequência de perdas</CardTitle>
                <span className="ml-auto text-xs text-muted">por run</span>
              </CardHeader>
              <CardContent>
                <StreakWrapper result={result} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function EquityBandWrapper({
  result,
  rules,
}: {
  result: SimResult;
  rules: SimMesaRules | null;
}) {
  return (
    <EquityBandChart
      result={result}
      saldoInicial={rules?.saldoInicial ?? 0}
      metaProfit={rules?.metaProfit ?? 0}
      maxDrawdown={rules?.maxDrawdown ?? null}
    />
  );
}

function EquityHistWrapper({
  result,
  rules,
}: {
  result: SimResult;
  rules: SimMesaRules | null;
}) {
  return <EquityHistChart result={result} saldoInicial={rules?.saldoInicial ?? 0} />;
}

function StreakWrapper({ result }: { result: SimResult }) {
  return <StreakChart result={result} />;
}
