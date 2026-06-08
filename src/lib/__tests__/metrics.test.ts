import { describe, it, expect } from 'vitest'
import { computeSummary, tendencyStats, type MetricTrade, type TaggedTrade } from '../metrics'
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

describe('tendencyStats', () => {
  function tt(over: Partial<TaggedTrade> & { resultadoValor: number }): TaggedTrade {
    return {
      resultado:
        over.resultado ??
        (over.resultadoValor > 0 ? 'win' : over.resultadoValor < 0 ? 'loss' : 'be'),
      rrRealizado: null,
      tags: over.tags ?? [],
      ...over,
    }
  }

  it('agrupa por tag e soma o P&L de cada uma', () => {
    const stats = tendencyStats([
      tt({ resultadoValor: -100, tags: [{ nome: 'Moveu o stop', tipo: 'erro' }] }),
      tt({ resultadoValor: -50, tags: [{ nome: 'Moveu o stop', tipo: 'erro' }] }),
      tt({ resultadoValor: 80, tags: [{ nome: 'FOMO', tipo: 'emocao' }] }),
    ])
    const stop = stats.find((s) => s.nome === 'Moveu o stop')!
    expect(stop.count).toBe(2)
    expect(stop.netPL).toBe(-150)
    expect(stop.winRate).toBe(0)
  })

  it('ordena do mais custoso (menor P&L) para o mais lucrativo', () => {
    const stats = tendencyStats([
      tt({ resultadoValor: 200, tags: [{ nome: 'Bom', tipo: 'erro' }] }),
      tt({ resultadoValor: -300, tags: [{ nome: 'Caro', tipo: 'erro' }] }),
    ])
    expect(stats[0].nome).toBe('Caro')
    expect(stats[1].nome).toBe('Bom')
  })

  it('um trade com várias tags conta em cada uma', () => {
    const stats = tendencyStats([
      tt({
        resultadoValor: -100,
        tags: [
          { nome: 'Moveu o stop', tipo: 'erro' },
          { nome: 'FOMO', tipo: 'emocao' },
        ],
      }),
    ])
    expect(stats).toHaveLength(2)
    expect(stats.every((s) => s.count === 1 && s.netPL === -100)).toBe(true)
  })

  it('winRate usa o campo resultado (win)', () => {
    const stats = tendencyStats([
      tt({ resultadoValor: 50, resultado: 'win', tags: [{ nome: 'X', tipo: 'erro' }] }),
      tt({ resultadoValor: -50, resultado: 'loss', tags: [{ nome: 'X', tipo: 'erro' }] }),
    ])
    expect(stats[0].winRate).toBe(50)
  })

  it('sem trades retorna lista vazia', () => {
    expect(tendencyStats([])).toEqual([])
  })
})
