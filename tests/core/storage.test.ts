import { beforeEach, describe, expect, it } from "vitest";

import {
  ATTEMPTS_STORAGE_KEY,
  createLocalAttemptStore,
  createMemoryStorage,
  StorageError,
  type Attempt,
  type AttemptStore,
  type StorageLike,
} from "@/core/storage";

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    schemaVersion: 1,
    id: "attempt-1",
    caseId: "backlog-fintech-01",
    moduleId: "backlog",
    startedAt: "2026-11-09T10:00:00.000Z",
    submittedAt: "2026-11-09T10:20:00.000Z",
    answer: { sprint: ["T-1", "T-4"] },
    result: {
      total: 72,
      criteria: [
        { id: "value", label: "Value", weight: 100, ratio: 0.72, points: 72 },
      ],
    },
    ...overrides,
  };
}

describe("local attempt store", () => {
  let storage: StorageLike;
  let store: AttemptStore;

  beforeEach(() => {
    storage = createMemoryStorage();
    store = createLocalAttemptStore(storage);
  });

  it("starts empty", async () => {
    expect(await store.listAttempts()).toEqual([]);
    expect(await store.getAttempt("nope")).toBeNull();
    expect(await store.getBestScore("backlog-fintech-01")).toBeNull();
  });

  it("saves and reads back an attempt", async () => {
    const attempt = makeAttempt();
    await store.saveAttempt(attempt);
    expect(await store.getAttempt(attempt.id)).toEqual(attempt);
  });

  it("persists across store instances sharing the same storage", async () => {
    await store.saveAttempt(makeAttempt());
    const reopened = createLocalAttemptStore(storage);
    expect(await reopened.listAttempts()).toHaveLength(1);
  });

  it("replaces an attempt saved again with the same id", async () => {
    await store.saveAttempt(makeAttempt());
    await store.saveAttempt(makeAttempt({ aiFeedback: { summary: "Nice" } }));
    const all = await store.listAttempts();
    expect(all).toHaveLength(1);
    expect(all[0].aiFeedback).toEqual({ summary: "Nice" });
  });

  it("lists newest first and filters by module and case", async () => {
    await store.saveAttempt(makeAttempt({ id: "old" }));
    await store.saveAttempt(
      makeAttempt({ id: "new", submittedAt: "2026-11-10T09:00:00.000Z" }),
    );
    await store.saveAttempt(
      makeAttempt({
        id: "other",
        moduleId: "metric-drop",
        caseId: "metric-drop-01",
        submittedAt: "2026-11-09T12:00:00.000Z",
      }),
    );

    expect((await store.listAttempts()).map((a) => a.id)).toEqual([
      "new",
      "other",
      "old",
    ]);
    expect(
      (await store.listAttempts({ moduleId: "backlog" })).map((a) => a.id),
    ).toEqual(["new", "old"]);
    expect(
      (await store.listAttempts({ caseId: "metric-drop-01" })).map((a) => a.id),
    ).toEqual(["other"]);
  });

  it("returns the best score per case", async () => {
    const withTotal = (id: string, total: number) =>
      makeAttempt({ id, result: { ...makeAttempt().result, total } });
    await store.saveAttempt(withTotal("a", 40));
    await store.saveAttempt(withTotal("b", 85));
    await store.saveAttempt(withTotal("c", 60));
    expect(await store.getBestScore("backlog-fintech-01")).toBe(85);
  });

  it("keeps extra result fields a module attaches", async () => {
    const attempt = makeAttempt({
      result: { ...makeAttempt().result, deliveredValue: 310 },
    });
    await store.saveAttempt(attempt);
    expect((await store.getAttempt(attempt.id))?.result).toMatchObject({
      deliveredValue: 310,
    });
  });

  it("deletes one attempt and clears all", async () => {
    await store.saveAttempt(makeAttempt({ id: "a" }));
    await store.saveAttempt(makeAttempt({ id: "b" }));
    await store.deleteAttempt("a");
    expect((await store.listAttempts()).map((a) => a.id)).toEqual(["b"]);
    await store.clear();
    expect(await store.listAttempts()).toEqual([]);
    expect(storage.getItem(ATTEMPTS_STORAGE_KEY)).toBeNull();
  });

  it("refuses to save an invalid attempt", async () => {
    const invalid = { ...makeAttempt(), submittedAt: "yesterday" };
    await expect(store.saveAttempt(invalid)).rejects.toThrow();
    expect(await store.listAttempts()).toEqual([]);
  });

  describe("with corrupted or tampered storage", () => {
    it("ignores non-JSON content", async () => {
      storage.setItem(ATTEMPTS_STORAGE_KEY, "{not json");
      expect(await store.listAttempts()).toEqual([]);
    });

    it("ignores content that is not a list", async () => {
      storage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify({ hello: "world" }));
      expect(await store.listAttempts()).toEqual([]);
    });

    it("drops invalid entries and keeps valid ones", async () => {
      storage.setItem(
        ATTEMPTS_STORAGE_KEY,
        JSON.stringify([
          makeAttempt({ id: "valid" }),
          { id: "broken" },
          { ...makeAttempt({ id: "cheater" }), result: { total: 9000 } },
          null,
        ]),
      );
      expect((await store.listAttempts()).map((a) => a.id)).toEqual(["valid"]);
    });

    it("recovers by saving over corrupted content", async () => {
      storage.setItem(ATTEMPTS_STORAGE_KEY, "garbage");
      await store.saveAttempt(makeAttempt());
      expect(await store.listAttempts()).toHaveLength(1);
    });
  });

  it("reports a StorageError when the browser rejects the write", async () => {
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
      removeItem: () => {},
    };
    await expect(
      createLocalAttemptStore(full).saveAttempt(makeAttempt()),
    ).rejects.toBeInstanceOf(StorageError);
  });

  it("treats unreadable storage as empty", async () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(await createLocalAttemptStore(blocked).listAttempts()).toEqual([]);
  });
});
