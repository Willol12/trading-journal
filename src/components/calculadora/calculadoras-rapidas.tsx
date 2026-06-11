"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MNQ,
  contractsForRisk,
  breakevenWinRate,
  breakevenWinRateUsd,
  expectedTradesToTarget,
} from "@/lib/simulator";
import { fmtMoney, fmtNumber, fmtPct } from "@/lib/format";
import { Field, NumInput, ResultRow, num } from "./fields";

export function CalculadorasRapidas() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PosicaoCard />
      <ConversorCard />
      <BreakevenCard />
      <MetaCard />
    </div>
  );
}

// 1 · Tamanho de posição: quantos contratos cabem no risco
function PosicaoCard() {
  const [risco, setRisco] = useState("50");
  const [stop, setStop] = useState("100");
  const [tickVal, setTickVal] = useState("0.50");

  const r = contractsForRisk(num(risco), num(stop), num(tickVal, MNQ.tickValueUsd));
  const porContrato = num(stop) * num(tickVal, MNQ.tickValueUsd);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tamanho de posição</CardTitle>
        <span className="ml-auto text-xs text-muted">risco → contratos</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Risco máx. (US$)">
            <NumInput value={risco} onChange={setRisco} />
          </Field>
          <Field label="Stop (ticks)">
            <NumInput value={stop} onChange={setStop} />
          </Field>
          <Field label="Valor do tick (US$)">
            <NumInput value={tickVal} onChange={setTickVal} />
          </Field>
        </div>
        <div>
          <ResultRow label="Risco por contrato" value={fmtMoney(porContrato)} />
          <ResultRow
            label="Contratos"
            value={r.contratos}
            tone={r.contratos > 0 ? "accent" : "loss"}
          />
          <ResultRow label="Risco real" value={fmtMoney(r.riscoReal)} />
        </div>
        {r.contratos === 0 && (
          <p className="text-xs text-loss">
            O risco não cobre nem 1 contrato com esse stop — aumente o risco ou
            diminua o stop.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// 2 · Conversor MNQ: ticks ↔ pontos ↔ US$
function ConversorCard() {
  const [ticks, setTicks] = useState("100");
  const [contratos, setContratos] = useState("1");
  const [usd, setUsd] = useState("150");

  const c = Math.max(1, Math.floor(num(contratos, 1)));
  const t = num(ticks);
  const v = num(usd);
  const ticksFromUsd = v / (MNQ.tickValueUsd * c);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversor MNQ</CardTitle>
        <span className="ml-auto text-xs text-muted">
          tick {MNQ.tickSize} pt = {fmtMoney(MNQ.tickValueUsd)}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ticks">
            <NumInput value={ticks} onChange={setTicks} />
          </Field>
          <Field label="Contratos">
            <NumInput value={contratos} onChange={setContratos} />
          </Field>
        </div>
        <div>
          <ResultRow label="Pontos" value={fmtNumber(t * MNQ.tickSize, 2)} />
          <ResultRow
            label="Valor"
            value={fmtMoney(t * MNQ.tickValueUsd * c)}
            tone="accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
          <Field label="US$ → ticks">
            <NumInput value={usd} onChange={setUsd} />
          </Field>
          <div className="pt-5 text-sm text-fg">
            = <span className="font-mono font-medium">{fmtNumber(ticksFromUsd, 0)}</span>{" "}
            ticks ({fmtNumber(ticksFromUsd * MNQ.tickSize, 1)} pts)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 3 · Win rate de breakeven do payoff
function BreakevenCard() {
  const [stop, setStop] = useState("100");
  const [alvo, setAlvo] = useState("300");
  const [comissao, setComissao] = useState("1.50");
  const [contratos, setContratos] = useState("1");

  const c = Math.max(1, Math.floor(num(contratos, 1)));
  const riskUsd = num(stop) * MNQ.tickValueUsd * c;
  const targetUsd = num(alvo) * MNQ.tickValueUsd * c;
  const payoffR = num(stop) > 0 ? num(alvo) / num(stop) : 0;
  const semCusto = breakevenWinRate(payoffR);
  const comCusto = breakevenWinRateUsd(riskUsd, targetUsd, num(comissao));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win rate de breakeven</CardTitle>
        <span className="ml-auto text-xs text-muted">o mínimo pra não perder</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <Field label="Stop (ticks)">
            <NumInput value={stop} onChange={setStop} />
          </Field>
          <Field label="Alvo (ticks)">
            <NumInput value={alvo} onChange={setAlvo} />
          </Field>
          <Field label="Comissão (US$)">
            <NumInput value={comissao} onChange={setComissao} />
          </Field>
          <Field label="Contratos">
            <NumInput value={contratos} onChange={setContratos} />
          </Field>
        </div>
        <div>
          <ResultRow label="Payoff" value={`${fmtNumber(payoffR, 2)}R`} />
          <ResultRow label="WR breakeven (sem custos)" value={fmtPct(semCusto * 100, 1)} />
          <ResultRow
            label="WR breakeven (com comissão)"
            value={fmtPct(comCusto * 100, 1)}
            tone="accent"
          />
        </div>
        <p className="text-xs text-muted">
          Acertando acima disso você tem expectativa positiva; pra APROVAR com
          segurança numa mesa, mire bem acima (veja o Guia).
        </p>
      </CardContent>
    </Card>
  );
}

// 4 · Quanto falta pra meta
function MetaCard() {
  const [meta, setMeta] = useState("1250");
  const [wr, setWr] = useState("40");
  const [stop, setStop] = useState("100");
  const [alvo, setAlvo] = useState("300");
  const [comissao, setComissao] = useState("1.50");

  const riskUsd = num(stop) * MNQ.tickValueUsd;
  const targetUsd = num(alvo) * MNQ.tickValueUsd;
  const r = expectedTradesToTarget(
    num(meta),
    num(wr) / 100,
    riskUsd,
    targetUsd,
    num(comissao),
  );
  const winsPuros = targetUsd > 0 ? Math.ceil(num(meta) / targetUsd) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quanto falta pra meta</CardTitle>
        <span className="ml-auto text-xs text-muted">1 contrato, 1 trade/dia</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Meta (US$)">
            <NumInput value={meta} onChange={setMeta} />
          </Field>
          <Field label="Win rate (%)">
            <NumInput value={wr} onChange={setWr} />
          </Field>
          <Field label="Comissão (US$)">
            <NumInput value={comissao} onChange={setComissao} />
          </Field>
          <Field label="Stop (ticks)">
            <NumInput value={stop} onChange={setStop} />
          </Field>
          <Field label="Alvo (ticks)">
            <NumInput value={alvo} onChange={setAlvo} />
          </Field>
        </div>
        <div>
          <ResultRow label="Mínimo teórico (só wins)" value={`${winsPuros} trades`} />
          {r ? (
            <>
              <ResultRow
                label="Expectativa por trade"
                value={fmtMoney(r.evPorTrade, { signed: true })}
                tone="profit"
              />
              <ResultRow label="Trades esperados" value={fmtNumber(r.trades, 0)} />
              <ResultRow
                label="Dias esperados (1/dia)"
                value={`~${fmtNumber(r.dias, 0)} dias`}
                tone="accent"
              />
            </>
          ) : (
            <ResultRow
              label="Expectativa por trade"
              value="negativa — meta inalcançável"
              tone="loss"
            />
          )}
        </div>
        <p className="text-xs text-muted">
          Esperança matemática, sem variância. A probabilidade real de chegar lá
          sem estourar o drawdown é o que o Simulador calcula.
        </p>
      </CardContent>
    </Card>
  );
}
