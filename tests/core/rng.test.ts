import { describe, expect, it } from "vitest";

import { createRng, hashString } from "@/core/rng";

const take = <T>(count: number, next: () => T): T[] =>
  Array.from({ length: count }, next);

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(take(100, a.next)).toEqual(take(100, b.next));
  });

  it("produces different sequences for different seeds", () => {
    expect(take(10, createRng(1).next)).not.toEqual(
      take(10, createRng(2).next),
    );
  });

  it("matches pinned reference values (guards against algorithm changes)", () => {
    // Changing these values would silently change every pregenerated case.
    expect(take(5, createRng(42).next)).toMatchInlineSnapshot(`
      [
        0.6011037519201636,
        0.44829055899754167,
        0.8524657934904099,
        0.6697340414393693,
        0.17481389874592423,
      ]
    `);
    expect(take(3, createRng(0).next)).toMatchInlineSnapshot(`
      [
        0.26642920868471265,
        0.0003297457005828619,
        0.2232720274478197,
      ]
    `);
  });

  it("returns floats in [0, 1) with a roughly uniform distribution", () => {
    const rng = createRng(7);
    const buckets = new Array<number>(10).fill(0);
    const draws = 20_000;
    for (let i = 0; i < draws; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      buckets[Math.floor(value * 10)] += 1;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(draws / 10 - 300);
      expect(count).toBeLessThan(draws / 10 + 300);
    }
  });

  it("treats seeds as unsigned 32-bit integers and rejects non-integers", () => {
    expect(createRng(-1).seed).toBe(4294967295);
    expect(take(5, createRng(-1).next)).toEqual(
      take(5, createRng(4294967295).next),
    );
    expect(() => createRng(1.5)).toThrow(RangeError);
    expect(() => createRng(Number.NaN)).toThrow(RangeError);
  });
});

describe("Rng helpers", () => {
  it("int stays within inclusive bounds and reaches both ends", () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i++) {
      const value = rng.int(1, 6);
      expect(Number.isInteger(value)).toBe(true);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rng.int(5, 5)).toBe(5);
    expect(() => rng.int(2, 1)).toThrow(RangeError);
    expect(() => rng.int(0.5, 2)).toThrow(RangeError);
  });

  it("float stays within [min, max)", () => {
    const rng = createRng(4);
    for (let i = 0; i < 2_000; i++) {
      const value = rng.float(-2, 3);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThan(3);
    }
    expect(() => rng.float(1, 0)).toThrow(RangeError);
    expect(() => rng.float(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("bool respects the probability", () => {
    const rng = createRng(5);
    expect(take(100, () => rng.bool(0)).some(Boolean)).toBe(false);
    expect(take(100, () => rng.bool(1)).every(Boolean)).toBe(true);
    const hits = take(10_000, () => rng.bool(0.25)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(2_300);
    expect(hits).toBeLessThan(2_700);
  });

  it("pick returns members and throws on an empty list", () => {
    const rng = createRng(6);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 100; i++) expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("weighted follows the weights and never returns zero-weight items", () => {
    const rng = createRng(8);
    const counts = { a: 0, b: 0, never: 0 };
    for (let i = 0; i < 10_000; i++) {
      counts[
        rng.weighted([
          { item: "a" as const, weight: 3 },
          { item: "never" as const, weight: 0 },
          { item: "b" as const, weight: 1 },
        ])
      ] += 1;
    }
    expect(counts.never).toBe(0);
    expect(counts.a / counts.b).toBeGreaterThan(2.6);
    expect(counts.a / counts.b).toBeLessThan(3.4);
    expect(() => rng.weighted([])).toThrow(RangeError);
    expect(() => rng.weighted([{ item: 1, weight: 0 }])).toThrow(RangeError);
    expect(() => rng.weighted([{ item: 1, weight: -1 }])).toThrow(RangeError);
  });

  it("shuffle is a deterministic permutation that does not mutate its input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...input];
    const shuffled = createRng(9).shuffle(input);
    expect(input).toEqual(copy);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
    expect(shuffled).toEqual(createRng(9).shuffle(input));
    expect(shuffled).not.toEqual(input);
  });

  it("sample returns distinct elements", () => {
    const rng = createRng(10);
    const sampled = rng.sample([1, 2, 3, 4, 5], 3);
    expect(sampled).toHaveLength(3);
    expect(new Set(sampled).size).toBe(3);
    expect(rng.sample([1, 2], 0)).toEqual([]);
    expect(() => rng.sample([1, 2], 3)).toThrow(RangeError);
  });

  it("normal has the requested mean and standard deviation", () => {
    const rng = createRng(11);
    const values = take(20_000, () => rng.normal(50, 10));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    expect(values.every(Number.isFinite)).toBe(true);
    expect(mean).toBeGreaterThan(49.5);
    expect(mean).toBeLessThan(50.5);
    expect(Math.sqrt(variance)).toBeGreaterThan(9.7);
    expect(Math.sqrt(variance)).toBeLessThan(10.3);
  });
});

describe("Rng.fork", () => {
  it("is deterministic per label and independent across labels", () => {
    const tickets = take(5, createRng(42).fork("tickets").next);
    expect(take(5, createRng(42).fork("tickets").next)).toEqual(tickets);
    expect(take(5, createRng(42).fork("events").next)).not.toEqual(tickets);
    expect(take(5, createRng(43).fork("tickets").next)).not.toEqual(tickets);
  });

  it("does not consume numbers from the parent stream", () => {
    const withFork = createRng(42);
    withFork.fork("tickets").next();
    expect(take(5, withFork.next)).toEqual(take(5, createRng(42).next));
  });
});

describe("hashString", () => {
  it("is a stable unsigned 32-bit hash", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
    expect(hashString("foobar")).toBe(0xbf9cf968);
    expect(hashString("backlog")).not.toBe(hashString("backlog2"));
  });
});
