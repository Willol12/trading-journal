"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importTrades, type ImportRow } from "@/app/trades/importar/actions";

const TARGETS: { key: keyof ImportRow; label: string; required?: boolean }[] = [
  { key: "dataHora", label: "Data / Hora" },
  { key: "symbol", label: "Ativo", required: true },
  { key: "direcao", label: "Direção" },
  { key: "contratos", label: "Contratos" },
  { key: "pontos", label: "Pontos" },
  { key: "pl", label: "P&L (US$)" },
  { key: "risco", label: "Risco (US$)" },
  { key: "rr", label: "R:R" },
  { key: "resultado", label: "Resultado" },
  { key: "setup", label: "Setup" },
  { key: "notas", label: "Notas" },
];

const GUESS: Record<keyof ImportRow, RegExp> = {
  dataHora: /data|date|time|hora/i,
  symbol: /ativo|symbol|instrument|ticker/i,
  direcao: /dire|side|market.?pos|action/i,
  contratos: /contr|qty|quant|size|lots/i,
  pontos: /ponto|point|tick/i,
  pl: /p&l|p\/l|pl|profit|lucro|net|result/i,
  risco: /risco|risk/i,
  rr: /^r$|rr|r:r|r-?mult/i,
  resultado: /result|outcome|win|loss/i,
  setup: /setup|estrat|strateg/i,
  notas: /nota|note|coment/i,
};

const selectCls =
  "h-8 w-full rounded-lg border border-border bg-surface-2 px-2 text-xs text-fg outline-none focus:border-accent";

export function ImportWizard({
  accounts,
  defaultAccountId,
}: {
  accounts: { id: string; nome: string }[];
  defaultAccountId?: string;
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? "");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data);
        // auto-guess
        const m: Record<string, string> = {};
        for (const t of TARGETS) {
          const found = hdrs.find((h) => GUESS[t.key].test(h));
          if (found) m[t.key] = found;
        }
        setMapping(m);
      },
      error: (err) => setError(err.message),
    });
  }

  function mapped(): ImportRow[] {
    return rows.map((r) => {
      const out: ImportRow = {};
      for (const t of TARGETS) {
        const col = mapping[t.key];
        if (col) out[t.key] = r[col];
      }
      return out;
    });
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await importTrades({ accountId, rows: mapped() });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na importação.");
    } finally {
      setBusy(false);
    }
  }

  const validRows = mapped().filter((r) => (r.symbol ?? "").trim());

  if (result) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-profit" />
        <h2 className="text-lg font-semibold text-fg">Importação concluída</h2>
        <p className="mt-1 text-sm text-muted">
          {result.inserted} trades importados
          {result.skipped > 0 && ` · ${result.skipped} ignorados`}.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => router.push(`/trades?conta=${accountId}`)} size="sm">
            Ver trades
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Passo 1: upload */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecione o CSV (export do NinjaTrader 8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 px-4 py-2 text-sm text-muted hover:text-fg">
              <Upload className="h-4 w-4" />
              {headers.length ? "Trocar arquivo" : "Escolher arquivo CSV"}
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
            </label>
          </div>
          {error && <p className="text-xs text-loss">{error}</p>}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <>
          {/* Passo 2: mapeamento */}
          <Card>
            <CardHeader>
              <CardTitle>2. Mapear colunas</CardTitle>
              <span className="ml-auto text-xs text-muted">
                {rows.length} linhas · {validRows.length} válidas
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TARGETS.map((t) => (
                  <div key={t.key}>
                    <label className="mb-1 block text-xs text-muted">
                      {t.label}
                      {t.required && <span className="text-loss"> *</span>}
                    </label>
                    <select
                      value={mapping[t.key] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [t.key]: e.target.value }))
                      }
                      className={selectCls}
                    >
                      <option value="">— ignorar —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Passo 3: preview */}
          <Card>
            <CardHeader>
              <CardTitle>3. Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      {TARGETS.filter((t) => mapping[t.key]).map((t) => (
                        <th key={t.key} className="px-2 py-1.5 font-medium">
                          {t.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mapped()
                      .slice(0, 6)
                      .map((r, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {TARGETS.filter((t) => mapping[t.key]).map((t) => (
                            <td key={t.key} className="px-2 py-1.5 text-fg">
                              {r[t.key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted">
                  Serão importados {validRows.length} trades para a conta selecionada.
                </p>
                <Button
                  onClick={confirm}
                  size="sm"
                  disabled={busy || !accountId || validRows.length === 0 || !mapping.symbol}
                >
                  {busy ? "Importando..." : `Importar ${validRows.length} trades`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
