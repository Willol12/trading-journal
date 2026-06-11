// RNG determinístico + amostradores estatísticos para o simulador Monte Carlo.
// Sem dependências: mulberry32 é rápido, pequeno e suficiente para simulação
// (não é criptográfico — nem precisa ser).

export type Rng = () => number; // uniforme em [0, 1)

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deriva uma seed independente por índice (mistura estilo murmur3 finalizer),
// p/ cada run/cenário ter seu próprio stream sem correlação entre vizinhos.
export function splitSeed(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

// Normal padrão via Box-Muller polar (sem trigonometria).
export function sampleNormal(rng: Rng): number {
  let u = 0;
  let v = 0;
  let s = 0;
  do {
    u = rng() * 2 - 1;
    v = rng() * 2 - 1;
    s = u * u + v * v;
  } while (s === 0 || s >= 1);
  return u * Math.sqrt((-2 * Math.log(s)) / s);
}

// Exponencial com média `mean` (1 - rng() ∈ (0, 1] evita log(0)).
export function sampleExp(rng: Rng, mean: number): number {
  return -mean * Math.log(1 - rng());
}

// Gamma(alpha, 1) via Marsaglia–Tsang (2000); para alpha < 1 usa o boost
// Gamma(alpha+1) * U^(1/alpha). Preferido a Jöhnk, que degrada com
// parâmetros grandes (e o posterior Beta aqui terá dezenas de trades).
export function sampleGamma(rng: Rng, alpha: number): number {
  if (alpha <= 0) return 0;
  if (alpha < 1) {
    const g = sampleGamma(rng, alpha + 1);
    return g * Math.pow(1 - rng(), 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x = 0;
    let v = 0;
    do {
      x = sampleNormal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

// Beta(alpha, beta) pela razão de gamas: X/(X+Y).
export function sampleBeta(rng: Rng, alpha: number, beta: number): number {
  const a = sampleGamma(rng, alpha);
  const b = sampleGamma(rng, beta);
  if (a + b === 0) return 0.5;
  return a / (a + b);
}
