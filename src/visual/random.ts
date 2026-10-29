export function hashToUnit(seed: number, index: number, slot: number, salt: number): number {
  let value =
    (seed ^
      Math.imul(index + 1, 0x85ebca77) ^
      Math.imul(slot + 1, 0xc2b2ae3d) ^
      Math.imul(salt + 1, 0x9e3779b1)) >>>
    0

  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  value = (value ^ (value >>> 16)) >>> 0

  return value / 4_294_967_296
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }

  return Date.now() >>> 0
}
