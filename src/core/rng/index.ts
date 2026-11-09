/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * Every number in a case (datasets, metrics, ticket values) must come from here
 * so that the same seed always produces the same case. Never use `Math.random()`
 * in generators or scoring.
 */

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export interface Rng {
  /** The seed this generator was created with. */
  readonly seed: number;
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  float(min: number, max: number): number;
  /** Uniform integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** `true` with the given probability (default 0.5). */
  bool(probability?: number): boolean;
  /** One element chosen uniformly. Throws on an empty list. */
  pick<T>(items: readonly T[]): T;
  /** One element chosen proportionally to its weight. */
  weighted<T>(items: readonly WeightedItem<T>[]): T;
  /** A shuffled copy (Fisher-Yates). The input is not mutated. */
  shuffle<T>(items: readonly T[]): T[];
  /** `count` distinct elements, in random order. */
  sample<T>(items: readonly T[], count: number): T[];
  /** Normally distributed float (Box-Muller). */
  normal(mean?: number, standardDeviation?: number): number;
  /**
   * An independent generator derived from this seed and a label.
   *
   * Forking does not consume numbers from the parent, so adding a new fork
   * (e.g. `rng.fork("events")`) never shifts the values of existing streams.
   */
  fork(label: string): Rng;
}

/** FNV-1a 32-bit hash. Used to derive seeds from labels and string ids. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
}

export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed)) {
    throw new RangeError(`RNG seed must be an integer, got ${seed}`);
  }
  const normalizedSeed = seed >>> 0;
  let state = normalizedSeed;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const float = (min: number, max: number): number => {
    assertFiniteNumber(min, "min");
    assertFiniteNumber(max, "max");
    if (max < min) throw new RangeError(`max (${max}) is below min (${min})`);
    return min + next() * (max - min);
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new RangeError(`int bounds must be integers, got ${min}..${max}`);
    }
    if (max < min) throw new RangeError(`max (${max}) is below min (${min})`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return {
    seed: normalizedSeed,
    next,
    float,
    int,
    bool: (probability = 0.5) => next() < probability,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0)
        throw new RangeError("Cannot pick from an empty list");
      return items[int(0, items.length - 1)];
    },
    weighted: <T>(items: readonly WeightedItem<T>[]): T => {
      if (items.length === 0)
        throw new RangeError("Cannot pick from an empty list");
      let total = 0;
      for (const { weight } of items) {
        if (!Number.isFinite(weight) || weight < 0) {
          throw new RangeError(
            `Weights must be finite and >= 0, got ${weight}`,
          );
        }
        total += weight;
      }
      if (total <= 0) throw new RangeError("At least one weight must be > 0");
      let threshold = next() * total;
      for (const { item, weight } of items) {
        threshold -= weight;
        if (threshold < 0) return item;
      }
      // Floating point slack: fall back to the last item with a positive weight.
      return items.findLast(({ weight }) => weight > 0)!.item;
    },
    shuffle,
    sample: <T>(items: readonly T[], count: number): T[] => {
      if (!Number.isInteger(count) || count < 0 || count > items.length) {
        throw new RangeError(
          `Cannot sample ${count} items from a list of ${items.length}`,
        );
      }
      return shuffle(items).slice(0, count);
    },
    normal: (mean = 0, standardDeviation = 1) => {
      // 1 - next() is in (0, 1], which keeps Math.log finite.
      const u = 1 - next();
      const v = next();
      const standard = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return mean + standard * standardDeviation;
    },
    fork: (label: string) =>
      createRng(hashString(`${normalizedSeed}:${label}`)),
  };
}
