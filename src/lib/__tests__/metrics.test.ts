import { describe, it, expect } from 'vitest'
import { computeSummary, type MetricTrade } from '../metrics'
import { fmtFactor } from '../format'

// Helper para montar um MetricTrade com defaults sensatos.
function trade(over: Partial<MetricTrade> & { resultadoValor: number }): MetricTrade {
  return {
    dataHora: new Date('2026-01-01T10:00:00'),
    resultado:
      over.resultado ??
      (over.resultadoValor > 0 ? 'win' : over.resultadoValor < 0 ? 'loss' : 'be'),
    rrRealizado: null,
    setupNome: null,
    instrumentSymbol: 'MNQ',
    direcao: 'long',
    contratos: 1,
    ...over,
  }
}

describe('computeSummary - bestTrade / worstTrade', () => {
  it('com apenas perdas, bestTrade é a menor perda (não 0)', () => {
    const s = computeSummary([
      trade({ resultadoValor: -100 }),
      trade({ resultadoValor: -50 }),
      trade({ resultadoValor: -200 }),
    ])
    expect(s.bestTrade).toBe(-50)
    expect(s.worstTrade).toBe(-200)
  })

  it('com apenas ganhos, worstTrade é o menor ganho (não 0)', () => {
    const s = computeSummary([
      trade({ resultadoValor: 50 }),
      trade({ resultadoValor: 100 }),
      trade({ resultadoValor: 200 }),
    ])
    expect(s.bestTrade).toBe(200)
    expect(s.worstTrade).toBe(50)
  })

  it('sem trades, bestTrade e worstTrade são 0', () => {
    const s = computeSummary([])
    expect(s.bestTrade).toBe(0)
    expect(s.worstTrade).toBe(0)
  })
})

describe('computeSummary - profitFactor / payoff', () => {
  it('sem perdas mas com ganhos, profitFactor e payoff são infinitos (null)', () => {
    const s = computeSummary([
      trade({ resultadoValor: 100 }),
      trade({ resultadoValor: 50 }),
    ])
    expect(s.profitFactor).toBeNull()
    expect(s.payoff).toBeNull()
    expect(fmtFactor(s.profitFactor)).toBe('∞')
  })

  it('com ganhos e perdas, profitFactor é grossProfit/grossLoss', () => {
    const s = computeSummary([
      trade({ resultadoValor: 100 }),
      trade({ resultadoValor: -50 }),
    ])
    expect(s.profitFactor).toBe(2)
  })

  it('sem trades, profitFactor é 0', () => {
    expect(computeSummary([]).profitFactor).toBe(0)
  })
})
