@AGENTS.md

# Sprint Zero

PM simulation platform. `MASTER_PROMPT.md` is the source of truth for product, architecture and the phase/milestone plan; read it before starting a milestone.

## Commands

- `npm run dev` — dev server
- `npm run check` — lint + typecheck + tests (run before every commit)
- `npm run build` — production build
- `npm run format` — Prettier
- `npm run generate:backlog` — rebuild `src/modules/backlog/cases/*.json` from the seeded generator (`-- --check` to verify, `-- --rewrite` to polish wording with Claude)
- `npm run generate:metric-drop` — rebuild `src/modules/metric-drop/cases/*.json` from the specs in `content/cases.ts` (`-- --check` to verify)
- `npm run generate:ab-test` — rebuild `src/modules/ab-test/cases/*.json` from the specs in `content/cases.ts` (`-- --check` to verify)
- `npm run generate:feedback-triage` — rebuild `src/modules/feedback-triage/cases/*.json` from `content/` (`-- --check` to verify)
- `npm run generate:ux-critique` — rebuild `src/modules/ux-critique/cases/*.json` from the screen templates (`-- --check` to verify)
- `npm run generate:product-case` — rebuild `src/modules/product-case/cases/*.json` from `content/cases.ts` (`-- --check` to verify)
- `npm run generate:prd-writer` — rebuild `src/modules/prd-writer/cases/*.json` from `content/cases.ts` (`-- --check` to verify)

## Rules that are easy to break

- Ground truth (`hidden`) never reaches the client before submit. Case data is only read through `src/core/case-engine/case-repository.ts` and `src/modules/registry.server.ts` (both `server-only`); scoring runs in the `submitAttempt` Server Action.
- Numbers come from code, never from the LLM. Use `createRng(seed)` from `src/core/rng`; never `Math.random()` in generators or scoring.
- Scores are deterministic: build them with `buildScoreResult` from `src/core/scoring`.
- Claude is called only from the server via `getAIClient()` in `src/core/ai`. No `temperature`; output is schema-constrained and Zod-validated. Feedback goes through `generateFeedback` (`src/core/case-engine/feedback.ts`); modules give it digested facts with `feedbackContext`, and learner text always goes in the `learner_answer` block.
- Results pages re-score the stored answer on the server (`/results/[attemptId]`); never persist ground truth in the browser beyond what the attempt already holds.
- UI copy is English and lives in `src/i18n/en.ts`; code and comments in English.
- Metric Drop cases store a specification, not data: `buildDataset` regenerates the daily cube from the seed on the server, and the browser only gets query results. Never send the cube or `hidden` to the client.
- Backlog cases are generated, never edited by hand: change `content/` or `case-specs.ts`, then run `npm run generate:backlog`. A test fails if the JSON is out of date. The optimal sprint is derived in `plan.ts`, not stored.
- Adding a module: `src/modules/<id>/module.ts` (meta) + entry in `src/modules/catalog.ts` + registration in `src/modules/registry.server.ts` + its case view in `src/modules/case-view.tsx` + its results view in `src/modules/results-view.tsx`. Do not touch `src/core`.
- Planning rules live in pure, tested modules (e.g. `src/modules/backlog/planning.ts`); components only wire them to the UI and never see ground truth.
- Pages that read `params` do it inside a `<Suspense>` child (Cache Components), see `src/app/case/[caseId]/page.tsx`.
- New case views submit through `useSubmitAttempt` (`src/lib/use-submit-attempt.ts`): it scores on the server, stores the attempt and opens the results.
- A/B test cases store public counts and hidden traps. `findPatternProblem` (`src/modules/ab-test/build-case.ts`) must pass: each case shows exactly the traps it claims. Statistics live in `stats.ts` and are shared by the builder and the UI.
- Generated cases (`gen-<module>-<industry>-<level>-<seed>`) are rebuilt from their id by `registerModule({ generate })`; never store them. Generators must be pure and must only use `createRng`.
- Product Case scores only structured choices (segment, problems, build order, metrics; or facts used and the estimate). Free text is for the AI coach. Option ratings live in `content/cases.ts`; numbers in research and fact sheets come from the seed, and `findStructuredProblem` must pass.
- PRD Writer scores evidence cited, the success metric (metric, baseline, target, horizon), scope buckets and risks; every sentence the learner writes goes to the AI coach only. Numbers in documents are `{slots}` drawn from the seed; `findPrdProblem` must pass.
- Shared case UI lives in `src/components` (`OptionCard`, `SubmitDialog`, `RatingDots`) and drafts in `src/lib/draft.ts`; reuse them instead of copying.
- Design system (arcade retro): tokens live in `src/app/globals.css` (dark is the default theme; `--frame` is the 2px card border, `--ink` is accent text that reads in both themes, `--module-<id>` per module). Use `pixel-card`, `shadow-pixel` and `pixel-lift`; pixel font (`font-pixel`) only for titles, buttons, numbers and short labels, never for long text. Dense data (tickets, dashboards) stays flat. `tests/design/tokens.test.ts` checks WCAG AA for every token pair; see `/styleguide`.
- Game components live in `src/components/arcade` (sprites are character grids in `sprites.ts`). XP, levels, streaks and badges are derived from attempts by `src/core/progress`; never store them. Call `notifyAttemptsChanged()` after saving an attempt so progress views refresh.
