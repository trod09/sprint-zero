import {
  attemptSchema,
  StorageError,
  type Attempt,
  type AttemptFilter,
  type AttemptStore,
} from "./types";

/** Versioned so a future format change can migrate instead of crash. */
export const ATTEMPTS_STORAGE_KEY = "sprint-zero:attempts:v1";

/** The subset of the Web Storage API this store needs. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function newestFirst(a: Attempt, b: Attempt): number {
  return b.submittedAt.localeCompare(a.submittedAt);
}

/**
 * `AttemptStore` backed by a Web Storage object (normally `window.localStorage`).
 *
 * Reads are defensive: storage is user-editable, so anything that is not a
 * valid attempt is ignored instead of breaking the app.
 */
export function createLocalAttemptStore(
  storage: StorageLike,
  key: string = ATTEMPTS_STORAGE_KEY,
): AttemptStore {
  const readAll = (): Attempt[] => {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return [];
    }
    if (raw === null) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    const attempts: Attempt[] = [];
    for (const item of parsed) {
      const result = attemptSchema.safeParse(item);
      if (result.success) attempts.push(result.data);
    }
    return attempts;
  };

  const writeAll = (attempts: readonly Attempt[]): void => {
    try {
      storage.setItem(key, JSON.stringify(attempts));
    } catch (cause) {
      throw new StorageError(
        "Could not save your progress in this browser (storage may be full or disabled).",
        { cause },
      );
    }
  };

  return {
    async saveAttempt(attempt) {
      const valid = attemptSchema.parse(attempt);
      const others = readAll().filter((existing) => existing.id !== valid.id);
      writeAll([...others, valid]);
    },
    async getAttempt(id) {
      return readAll().find((attempt) => attempt.id === id) ?? null;
    },
    async listAttempts(filter: AttemptFilter = {}) {
      return readAll()
        .filter(
          (attempt) =>
            (filter.moduleId === undefined ||
              attempt.moduleId === filter.moduleId) &&
            (filter.caseId === undefined || attempt.caseId === filter.caseId),
        )
        .sort(newestFirst);
    },
    async getBestScore(caseId) {
      const scores = readAll()
        .filter((attempt) => attempt.caseId === caseId)
        .map((attempt) => attempt.result.total);
      return scores.length > 0 ? Math.max(...scores) : null;
    },
    async deleteAttempt(id) {
      const all = readAll();
      const remaining = all.filter((attempt) => attempt.id !== id);
      if (remaining.length !== all.length) writeAll(remaining);
    },
    async clear() {
      try {
        storage.removeItem(key);
      } catch (cause) {
        throw new StorageError("Could not clear your saved progress.", {
          cause,
        });
      }
    },
  };
}

/** In-memory Web Storage stand-in, for tests and browsers that block storage. */
export function createMemoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
