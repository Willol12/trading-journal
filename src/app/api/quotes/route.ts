// Cotações de mercado com atraso (Yahoo Finance, sem chave de API).
// Busca todos os símbolos em paralelo; falhas individuais são omitidas
// silenciosamente — nunca derruba a rota inteira.
//
// Cache server-side de 55s: independente de quantos usuários estão logados,
// o Yahoo recebe no máximo 1 batch de requests por minuto.
export const dynamic = "force-dynamic";

const CACHE_TTL = 55_000; // ms — ligeiramente abaixo do polling do cliente (60s)

// Yahoo bloqueia User-Agent não-browser (429). Usar UA de navegador.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface QuoteItem {
  key: string;
  label: string;
  price: number;
  changePct: number;
}

interface CacheEntry {
  quotes: QuoteItem[];
  atualizadoEm: string;
  ts: number;
}

// Cache in-memory: warm instances reusam, cold starts rebatem no Yahoo uma vez.
let _cache: CacheEntry | null = null;

interface YahooMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
}

const SYMBOLS: { key: string; label: string; yahoo: string; fallback?: string }[] = [
  // Índices de equity
  { key: "NQ",  label: "NQ (Nasdaq)",     yahoo: "NQ=F" },
  { key: "ES",  label: "ES (S&P 500)",    yahoo: "ES=F" },
  { key: "RTY", label: "RTY (Russell)",   yahoo: "RTY=F" },
  // Commodities
  { key: "GC",  label: "GC (Ouro)",       yahoo: "GC=F" },
  { key: "CL",  label: "CL (Petróleo)",   yahoo: "CL=F" },
  // Macro
  { key: "DXY", label: "DXY (Dólar)",     yahoo: "DX-Y.NYB", fallback: "DX=F" },
  { key: "ZN",  label: "ZN (T-Note 10Y)", yahoo: "ZN=F" },
  { key: "VIX", label: "VIX (Vol)",       yahoo: "^VIX" },
];

async function fetchQuote(yahoo: string): Promise<{ price: number; changePct: number } | null> {
  const encoded = encodeURIComponent(yahoo);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta: YahooMeta | undefined = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    if (price == null || prev == null || prev === 0) return null;
    const changePct = ((price - prev) / prev) * 100;
    return { price, changePct };
  } catch {
    return null;
  }
}

export async function GET() {
  // Serve do cache se ainda estiver fresco
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return Response.json({ quotes: _cache.quotes, atualizadoEm: _cache.atualizadoEm });
  }

  const results = await Promise.allSettled(
    SYMBOLS.map(async (s) => {
      let data = await fetchQuote(s.yahoo);
      if (data == null && s.fallback) data = await fetchQuote(s.fallback);
      if (data == null) return null;
      return { key: s.key, label: s.label, price: data.price, changePct: data.changePct } satisfies QuoteItem;
    }),
  );

  const quotes: QuoteItem[] = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((q): q is QuoteItem => q != null);

  const atualizadoEm = new Date().toISOString();
  _cache = { quotes, atualizadoEm, ts: Date.now() };

  return Response.json({ quotes, atualizadoEm });
}
