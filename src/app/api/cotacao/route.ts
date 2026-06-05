// Busca a cotação atual USD -> BRL (AwesomeAPI, gratuita, sem chave).
export async function GET() {
  try {
    const r = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL",
      { cache: "no-store" },
    );
    const j = await r.json();
    const rate = Number(j?.USDBRL?.bid);
    if (Number.isFinite(rate)) {
      return Response.json({ rate, atualizadoEm: new Date().toISOString() });
    }
    return Response.json({ error: "Cotação indisponível" }, { status: 502 });
  } catch {
    return Response.json({ error: "Falha ao buscar cotação" }, { status: 502 });
  }
}
