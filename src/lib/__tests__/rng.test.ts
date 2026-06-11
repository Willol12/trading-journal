import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  splitSeed,
  sampleNormal,
  sampleExp,
  sampleGamma,
  sampleBeta,
} from '../rng'

describe('mulberry32', () => {
  it('mesma seed produz a mesma sequência', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = Array.from({ length: 50 }, () => a())
    const seqB = Array.from({ length: 50 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('seeds diferentes produzem sequências diferentes', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('gera uniforme em [0,1) com média ~0.5', () => {
    const rng = mulberry32(7)
    let sum = 0
    const n = 50_000
    for (let i = 0; i < n; i++) {
      const u = rng()
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
      sum += u
    }
    expect(sum / n).toBeCloseTo(0.5, 2)
  })
})

describe('splitSeed', () => {
  it('índices diferentes derivam seeds diferentes', () => {
    const seeds = new Set(Array.from({ length: 1000 }, (_, i) => splitSeed(123, i)))
    expect(seeds.size).toBe(1000)
  })

  it('é determinístico', () => {
    expect(splitSeed(99, 5)).toBe(splitSeed(99, 5))
  })
})

describe('sampleNormal', () => {
  it('média ~0 e desvio ~1', () => {
    const rng = mulberry32(11)
    const n = 50_000
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < n; i++) {
      const x = sampleNormal(rng)
      sum += x
      sumSq += x * x
    }
    const mean = sum / n
    const sd = Math.sqrt(sumSq / n - mean * mean)
    expect(mean).toBeCloseTo(0, 1)
    expect(sd).toBeCloseTo(1, 1)
  })
})

describe('sampleExp', () => {
  it('média ~mean e sempre positivo', () => {
    const rng = mulberry32(13)
    const n = 50_000
    let sum = 0
    for (let i = 0; i < n; i++) {
      const x = sampleExp(rng, 8)
      expect(x).toBeGreaterThanOrEqual(0)
      sum += x
    }
    expect(sum / n).toBeCloseTo(8, 0)
  })
})

describe('sampleGamma / sampleBeta', () => {
  it('Gamma(alpha) tem média ~alpha', () => {
    const rng = mulberry32(17)
    const n = 30_000
    let sum = 0
    for (let i = 0; i < n; i++) sum += sampleGamma(rng, 4)
    expect(sum / n).toBeCloseTo(4, 1)
  })

  it('Beta(8,4) tem média ~0.667', () => {
    const rng = mulberry32(19)
    const n = 30_000
    let sum = 0
    for (let i = 0; i < n; i++) sum += sampleBeta(rng, 8, 4)
    expect(sum / n).toBeCloseTo(8 / 12, 2)
  })

  it('Beta com alpha < 1 fica em (0,1) sem NaN', () => {
    const rng = mulberry32(23)
    for (let i = 0; i < 5_000; i++) {
      const x = sampleBeta(rng, 0.5, 0.5)
      expect(Number.isNaN(x)).toBe(false)
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('Beta de posterior grande concentra perto da proporção (ex.: 70/100)', () => {
    const rng = mulberry32(29)
    for (let i = 0; i < 1_000; i++) {
      const x = sampleBeta(rng, 1 + 700, 1 + 300)
      expect(x).toBeGreaterThan(0.6)
      expect(x).toBeLessThan(0.8)
    }
  })
})
