/**
 * Client-safe entry point of the case engine: types, schemas and the leak guard.
 *
 * Server-only pieces are imported from their own files so they can never be
 * pulled into a client bundle by accident:
 *   - `@/core/case-engine/registry`
 *   - `@/core/case-engine/case-repository`
 *   - `@/core/case-engine/submission`
 */
export * from "./types";
export * from "./public-case";
