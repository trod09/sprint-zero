@AGENTS.md

# Sprint Zero

PM simulation platform. `MASTER_PROMPT.md` is the source of truth for product, architecture and the phase/milestone plan; read it before starting a milestone.

## Commands

- `npm run dev` — dev server
- `npm run check` — lint + typecheck + tests (run before every commit)
- `npm run build` — production build
- `npm run format` — Prettier
- `npm run generate:backlog` — rebuild `src/modules/backlog/cases/*.json` from the seeded generator (`-- --check` to verify, `-- --rewrite` to polish wording with Claude)

## Rules that are easy to break

- Ground truth (`hidden`) never reaches the client before submit. Case data is only read through `src/core/case-engine/case-repository.ts` and `src/modules/registry.server.ts` (both `server-only`); scoring runs in the `submitAttempt` Server Action.
- Numbers come from code, never from the LLM. Use `createRng(seed)` from `src/core/rng`; never `Math.random()` in generators or scoring.
- Scores are deterministic: build them with `buildScoreResult` from `src/core/scoring`.
- Claude is called only from the server via `getAIClient()` in `src/core/ai`. No `temperature`; output is schema-constrained and Zod-validated.
- UI copy is English and lives in `src/i18n/en.ts`; code and comments in English.
- Backlog cases are generated, never edited by hand: change `content/` or `case-specs.ts`, then run `npm run generate:backlog`. A test fails if the JSON is out of date. The optimal sprint is derived in `plan.ts`, not stored.
- Adding a module: `src/modules/<id>/module.ts` (meta) + entry in `src/modules/catalog.ts` + registration in `src/modules/registry.server.ts`. Do not touch `src/core`.
