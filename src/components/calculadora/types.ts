// Tipos compartilhados entre o server component da página e as abas (client).
// Tudo aqui precisa ser serializável (props de server → client).

export interface MesaPrefill {
  saldoInicial: number;
  metaProfit: number | null;
  maxDrawdown: number | null;
  tipoDrawdown: string;
  limitePerdaDiario: number | null;
  consistenciaPct: number | null;
  minDiasTrade: number | null;
}

/** Dados do diário do usuário p/ bootstrap e prior bayesiano. */
export interface JournalData {
  /** P&L em US$ de cada trade real (ordem cronológica). */
  outcomes: number[];
  wins: number;
  losses: number;
  contaNome: string | null;
  mesaPrefill: MesaPrefill | null;
}
