/**
 * Guard against leaking ground truth to the client.
 */

export const HIDDEN_KEY = "hidden";

export class HiddenDataLeakError extends Error {
  constructor(readonly path: string) {
    super(
      `Public case data contains ground truth at "${path}". ` +
        `A module's toPublicCase() must strip every "${HIDDEN_KEY}" key.`,
    );
    this.name = "HiddenDataLeakError";
  }
}

/** Returns the path of the first `hidden` key found at any depth, or `null`. */
export function findHiddenKey(value: unknown, path = "$"): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findHiddenKey(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      if (key === HIDDEN_KEY) return `${path}.${key}`;
      const found = findHiddenKey(child, `${path}.${key}`);
      if (found) return found;
    }
  }
  return null;
}

export function assertNoHiddenKeys(value: unknown): void {
  const path = findHiddenKey(value);
  if (path) throw new HiddenDataLeakError(path);
}
