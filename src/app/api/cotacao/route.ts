// Busca a cotação atual USD -> BRL. Tenta 2 APIs gratuitas (sem chave) com
// fallback, User-Agent e timeout — robusto pro ambiente da Vercel.
export const dynamic = "force-dynamic";

async function fromAwesome(): Promise<number | null> {
  try {
    const r = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL",
      {
        cache: "no-store",
        headers: { "User-Agent": "trading-journal/1.0 (+vercel)" },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const rate = Number(j?.USDBRL?.bid);
    return Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}

async function fromErApi(): Promise<number | null> {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const rate = Number(j?.rates?.BRL);
    return Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const rate = (await fromAwesome()) ?? (await fromErApi());
  if (rate != null) {
    return Response.json({ rate, atualizadoEm: new Date().toISOString() });
  }
  return Response.json({ error: "Cotação indisponível" }, { status: 502 });
}
