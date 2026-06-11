import { describe, it, expect } from 'vitest'
import {
  simulate,
  compareScenarios,
  requiredWinRate,
  breakevenWinRate,
  breakevenWinRateUsd,
  riskOfRuin,
  contractsForRisk,
  expectedTradesToTarget,
  type SimMesaRules,
  type ParametricModel,
  type FixedModel,
  type SimResult,
} from '../simulator'

// Lucid 25k como base: meta $1.250, DD $1.000 EOD trailing travado no inicial.
// Consistência/min dias ficam null por padrão p/ isolar cada regra nos testes.
function lucid25k(over: Partial<SimMesaRules> = {}): SimMesaRules {
  return {
    saldoInicial: 25000,
    metaProfit: 1250,
    maxDrawdown: 1000,
    tipoDrawdown: 'eod',
    limitePerdaDiario: null,
    limiteDiarioElimina: false,
    consistenciaPct: null,
    minDiasTrade: null,
    custoAvaliacaoUsd: null,
    ...over,
  }
}

// ATM 1x3 do usuário: stop $50, alvo $150, sem custos (salvo override).
function par(over: Partial<ParametricModel> = {}): ParametricModel {
  return {
    kind: 'parametric',
    winRate: 0.5,
    beRate: 0,
    riskUsd: 50,
    targetUsd: 150,
    commissionUsd: 0,
    slippage: null,
    winRateUncertainty: null,
    ...over,
  }
}

function fixed(outcomes: number[]): FixedModel {
  return { kind: 'fixed', outcomes }
}

const FAST = { nRuns: 200, maxDays: 60, seed: 1 }

describe('simulate — casos extremos determinísticos', () => {
  it('WR=100% sempre aprova em ceil(meta/alvo) = 9 dias', () => {
    const r = simulate(lucid25k(), par({ winRate: 1 }), FAST)
    expect(r.passProb).toBe(1)
    expect(r.bustProb).toBe(0)
    expect(r.daysToPass.p50).toBe(9)
    expect(r.daysToPass.p25).toBe(9)
    expect(r.daysToPass.p75).toBe(9)
  })

  it('WR=0% com risco $50 elimina em exatamente 20 trades (DD $1.000)', () => {
    const r = simulate(lucid25k(), par({ winRate: 0 }), FAST)
    expect(r.bustProb).toBe(1)
    expect(r.maxLossStreak.p95).toBe(20)
    // equity final de todos os runs = 25.000 − 20×50 = 24.000 (um só bucket)
    expect(r.finalEquityHist).toHaveLength(1)
    expect(r.finalEquityHist[0].x0).toBe(24000)
    // trajetória: dia 0 + 20 dias = 21 pontos
    const bust = r.samplePaths.find((s) => s.outcome === 'bust')!
    expect(bust.path).toHaveLength(21)
    expect(bust.path[0]).toBe(25000)
    expect(bust.path[20]).toBe(24000)
  })

  it('banda começa no saldo inicial', () => {
    const r = simulate(lucid25k(), par({ winRate: 1 }), FAST)
    expect(r.band[0]).toMatchObject({ day: 0, p10: 25000, p50: 25000, p90: 25000 })
  })
})

describe('simulate — piso de drawdown', () => {
  const semMeta = { metaProfit: 999999 }

  it('EOD: piso trava no saldo inicial depois que o pico sobe $1.000', () => {
    // dia1 +500 (piso 24.500), dia2 +700 (pico 26.200 → piso trava em 25.000)
    const vive = simulate(
      lucid25k(semMeta),
      fixed([500, 700, -1199]),
      { ...FAST, maxDays: 3 },
    )
    expect(vive.timeoutProb).toBe(1) // 25.001 > 25.000 → vivo

    const morre = simulate(
      lucid25k(semMeta),
      fixed([500, 700, -1201]),
      { ...FAST, maxDays: 3 },
    )
    expect(morre.bustProb).toBe(1) // 24.999 ≤ 25.000 → eliminado
  })

  it('EOD: tocar o piso intraday elimina mesmo que o dia fechasse acima', () => {
    // dia1 fecha 25.500 → piso 24.500; dia2 trade1 −1.400 toca 24.100
    const r = simulate(
      lucid25k(semMeta),
      fixed([500, 0, -1400, 1400]),
      { ...FAST, maxDays: 2, tradesPerDay: 2 },
    )
    expect(r.bustProb).toBe(1)
  })

  it('static não trila: mesma sequência sobrevive onde o EOD elimina', () => {
    const seq = [500, 700, -1300] // EOD: piso travado 25.000 → 24.900 elimina
    const eod = simulate(lucid25k(semMeta), fixed(seq), { ...FAST, maxDays: 3 })
    const est = simulate(
      lucid25k({ ...semMeta, tipoDrawdown: 'static' }),
      fixed(seq),
      { ...FAST, maxDays: 3 },
    )
    expect(eod.bustProb).toBe(1)
    expect(est.timeoutProb).toBe(1) // piso fixo 24.000; 24.900 sobrevive
  })
})

describe('simulate — regras de aprovação', () => {
  it('consistência 50%: dia de $1.000 só aprova quando lucro total ≥ $2.000', () => {
    const r = simulate(
      lucid25k({ consistenciaPct: 50, minDiasTrade: 2 }),
      fixed([1000, ...Array(25).fill(150)]),
      { ...FAST, maxDays: 30 },
    )
    expect(r.passProb).toBe(1)
    // cruza a meta no dia 3 ($1.300) mas o melhor dia ($1.000) > 50% do lucro;
    // só dilui no dia 8 ($2.050, 1.000 ≤ 1.025)
    expect(r.daysToPass.p50).toBe(8)
  })

  it('mínimo de 2 dias: meta batida no dia 1 não aprova', () => {
    const r = simulate(
      lucid25k({ minDiasTrade: 2 }),
      fixed([1300, 1300]),
      { ...FAST, maxDays: 5 },
    )
    expect(r.passProb).toBe(1)
    expect(r.daysToPass.p50).toBe(2)
  })

  it('limite diário que elimina: estourar reprova na hora', () => {
    const r = simulate(
      lucid25k({ limitePerdaDiario: 500, limiteDiarioElimina: true, metaProfit: 999999 }),
      fixed([-300, -300, 1000]),
      { ...FAST, maxDays: 3, tradesPerDay: 3 },
    )
    expect(r.bustProb).toBe(1)
  })

  it('limite diário que só encerra o dia: run continua', () => {
    const r = simulate(
      lucid25k({ limitePerdaDiario: 500, limiteDiarioElimina: false, metaProfit: 999999 }),
      fixed([-300, -300, 1000]),
      { ...FAST, maxDays: 3, tradesPerDay: 3 },
    )
    expect(r.bustProb).toBe(0)
    expect(r.timeoutProb).toBe(1)
  })
})

describe('simulate — bootstrap e Bayes', () => {
  it('bootstrap de outcomes só positivos aprova como WR=100%', () => {
    const r = simulate(
      lucid25k(),
      { kind: 'bootstrap', outcomes: [150], blockSize: 1, scale: 1 },
      FAST,
    )
    expect(r.passProb).toBe(1)
    expect(r.daysToPass.p50).toBe(9)
  })

  it('bootstrap só de perdas elimina; blockSize não muda outcome constante', () => {
    const iid = simulate(
      lucid25k(),
      { kind: 'bootstrap', outcomes: [-50], blockSize: 1, scale: 1 },
      FAST,
    )
    const block = simulate(
      lucid25k(),
      { kind: 'bootstrap', outcomes: [-50], blockSize: 5, scale: 1 },
      FAST,
    )
    expect(iid.bustProb).toBe(1)
    expect(block.bustProb).toBe(1)
  })

  it('scale multiplica o tamanho (2x perde em metade dos trades)', () => {
    const r = simulate(
      lucid25k(),
      { kind: 'bootstrap', outcomes: [-50], blockSize: 1, scale: 2 },
      FAST,
    )
    expect(r.bustProb).toBe(1)
    const bust = r.samplePaths.find((s) => s.outcome === 'bust')!
    expect(bust.path).toHaveLength(11) // 10 trades de −$100
  })

  it('Bayes com amostra gigante converge pro WR fixo', () => {
    const r = simulate(
      lucid25k(),
      par({ winRateUncertainty: { wins: 1_000_000, losses: 0, priorAlpha: 1, priorBeta: 1 } }),
      { nRuns: 500, maxDays: 60, seed: 3 },
    )
    expect(r.passProb).toBeGreaterThan(0.99)
  })

  it('Bayes com amostra pequena (5W/5L) fica entre WR fixo 30% e 70%', () => {
    const slow = { nRuns: 3000, maxDays: 120, seed: 7 }
    const m1x2 = { riskUsd: 50, targetUsd: 100 }
    const lo = simulate(lucid25k(), par({ ...m1x2, winRate: 0.3 }), slow).passProb
    const hi = simulate(lucid25k(), par({ ...m1x2, winRate: 0.7 }), slow).passProb
    const bayes = simulate(
      lucid25k(),
      par({ ...m1x2, winRateUncertainty: { wins: 5, losses: 5, priorAlpha: 1, priorBeta: 1 } }),
      slow,
    ).passProb
    expect(bayes).toBeGreaterThan(lo)
    expect(bayes).toBeLessThan(hi)
  })
})

describe('simulate — determinismo', () => {
  // normaliza o tempo de execução (único campo não-determinístico)
  const strip = (r: SimResult) => ({ ...r, elapsedMs: 0 })

  it('mesma seed → resultado idêntico; seed diferente → resultado diferente', () => {
    const cfg = par({ winRate: 0.45, riskUsd: 50, targetUsd: 100 })
    const a = simulate(lucid25k(), cfg, { nRuns: 1000, seed: 5 })
    const b = simulate(lucid25k(), cfg, { nRuns: 1000, seed: 5 })
    const c = simulate(lucid25k(), cfg, { nRuns: 1000, seed: 6 })
    expect(strip(a)).toEqual(strip(b))
    expect(a.passProb).not.toBe(c.passProb)
  })
})

describe('fórmulas analíticas', () => {
  it('breakevenWinRate: 3R=25%, 2R≈33,3%, 1R=50%', () => {
    expect(breakevenWinRate(3)).toBe(0.25)
    expect(breakevenWinRate(2)).toBeCloseTo(1 / 3, 6)
    expect(breakevenWinRate(1)).toBe(0.5)
  })

  it('breakevenWinRateUsd inclui comissão', () => {
    expect(breakevenWinRateUsd(50, 150, 0)).toBe(0.25)
    expect(breakevenWinRateUsd(50, 150, 1.5)).toBeCloseTo(51.5 / 200, 6)
  })

  it('riskOfRuin com R=1 bate com a fórmula fechada (q/p)^N', () => {
    const ror = riskOfRuin(0.55, 1, 10)
    const closed = Math.pow(0.45 / 0.55, 10)
    expect(Math.abs(ror - closed)).toBeLessThan(1e-6)
  })

  it('riskOfRuin: sem edge → 1; WR=100% → 0', () => {
    expect(riskOfRuin(0.25, 3, 20)).toBe(1) // exatamente no breakeven
    expect(riskOfRuin(0.2, 3, 20)).toBe(1)
    expect(riskOfRuin(1, 3, 20)).toBe(0)
  })

  it('riskOfRuin ≈ Monte Carlo com DD estático e sem meta alcançável', () => {
    const ror = riskOfRuin(0.55, 1, 10) // ≈ 0,134
    const mc = simulate(
      lucid25k({
        tipoDrawdown: 'static',
        maxDrawdown: 1000,
        metaProfit: 1e9,
      }),
      par({ winRate: 0.55, riskUsd: 100, targetUsd: 100 }),
      { nRuns: 2000, maxDays: 1500, seed: 11 },
    )
    expect(Math.abs(mc.bustProb - ror)).toBeLessThan(0.03)
  })

  it('contractsForRisk: $50 com stop 100t → 1 contrato MNQ', () => {
    expect(contractsForRisk(50, 100)).toEqual({ contratos: 1, riscoReal: 50 })
    expect(contractsForRisk(49, 100).contratos).toBe(0)
    expect(contractsForRisk(120, 100)).toEqual({ contratos: 2, riscoReal: 100 })
  })

  it('expectedTradesToTarget: EV $50/trade → 25 trades até $1.250', () => {
    const r = expectedTradesToTarget(1250, 0.5, 50, 150)!
    expect(r.evPorTrade).toBe(50)
    expect(r.trades).toBe(25)
    expect(r.dias).toBe(25)
    expect(expectedTradesToTarget(1250, 0.2, 50, 150)).toBeNull() // EV ≤ 0
  })
})

describe('requiredWinRate e compareScenarios', () => {
  it('WR necessário é monotônico no alvo de aprovação (1x3 na Lucid 25k)', () => {
    const base = par({ winRate: 0.5 })
    const p = { nRuns: 1200, seed: 2 }
    const wr50 = requiredWinRate(lucid25k(), base, 0.5, p)!
    const wr80 = requiredWinRate(lucid25k(), base, 0.8, p)!
    const wr90 = requiredWinRate(lucid25k(), base, 0.9, p)!
    expect(wr50).not.toBeNull()
    expect(wr80).toBeGreaterThanOrEqual(wr50)
    expect(wr90).toBeGreaterThanOrEqual(wr80)
    // sanidade: precisa de mais que o breakeven (25%) p/ aprovar com folga
    expect(wr50).toBeGreaterThan(0.25)
  })

  it('compareScenarios ranqueia por probabilidade de aprovação', () => {
    const out = compareScenarios(
      lucid25k(),
      [
        { nome: 'fraco', model: par({ winRate: 0.2, riskUsd: 50, targetUsd: 100 }) },
        { nome: 'forte', model: par({ winRate: 0.9, riskUsd: 50, targetUsd: 100 }) },
      ],
      { nRuns: 500, seed: 4 },
    )
    expect(out).toHaveLength(2)
    expect(out[0].nome).toBe('forte')
    expect(out[0].passProb).toBeGreaterThan(out[1].passProb)
  })
})
