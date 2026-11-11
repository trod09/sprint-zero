@AGENTS.md

# Sprint Zero

PM simulation platform. `MASTER_PROMPT.md` is the source of truth for product, architecture and the phase/milestone plan; read it before starting a milestone.

## Commands

- `npm run dev` — dev server
- `npm run check` — lint + typecheck + tests (run before every commit)
- `npm run test:e2e` — Playwright: every page on desktop (dark and light) and on a phone must load without console errors, fit without sideways scroll and pass axe (WCAG A/AA, serious and critical), plus one full played case per module. Uses the installed Chrome and the dev server on :3000 (started if needed). Run it after UI changes.
- `npm run build` — production build
- `npm run format` — Prettier
- `npm run generate:backlog` — rebuild `src/modules/backlog/cases/*.json` from the seeded generator (`-- --check` to verify, `-- --rewrite` to polish wording with Claude)
- `npm run generate:metric-drop` — rebuild `src/modules/metric-drop/cases/*.json` from the specs in `content/cases.ts` (`-- --check` to verify)
- `npm run generate:ab-test` — rebuild `src/modules/ab-test/cases/*.json` from the specs in `content/cases.ts` (`-- --check` to verify)
- `npm run generate:feedback-triage` — rebuild `src/modules/feedback-triage/cases/*.json` from `content/` (`-- --check` to verify)
- `npm run generate:ux-critique` — rebuild `src/modules/ux-critique/cases/*.json` from the screen templates (`-- --check` to verify)
- `npm run generate:product-case` — rebuild `src/modules/product-case/cases/*.json` from `content/cases.ts` (`-- --check` to verify)
- `npm run generate:prd-writer` — rebuild `src/modules/prd-writer/cases/*.json` and their index from `content/cases.ts` and `content/specs/*.json` (`-- --check` to verify)
- `npm run draft:prd-writer -- --industry <key> [--level pm] [--feature "..."] [--model id] [--dry-run]` — draft a new PRD spec with Claude (needs `ANTHROPIC_API_KEY`), validated and saved to `content/specs/` for review

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
- Generated cases (`gen-<module>-<industry>-<level>-<seed>`) are rebuilt from their id by `registerModule({ generate })`; never store them. Generators must be pure and must only use `createRng`. Every module generates on demand. Metric Drop pairs a product (`content/products.ts`) with a root cause archetype; A/B pairs an experiment (`content/experiments.ts`) with a trap recipe that owns the numbers; Product Case generates estimations from factor-chain templates (`content/estimations.ts`).
- Product Case scores only structured choices (segment, problems, build order, metrics; or facts used and the estimate). Free text is for the AI coach. Option ratings live in `content/cases.ts`; numbers in research and fact sheets come from the seed, and `findStructuredProblem` must pass.
- PRD Writer scores evidence cited, the success metric (metric, baseline, target, horizon), scope buckets and risks; every sentence the learner writes goes to the AI coach only. Numbers in documents are `{slots}` drawn from the seed; `findPrdProblem` must pass. New PRD specs are plain data in `content/specs/*.json` (expressions such as `"goal - 2"` replace functions, evaluated by the parser in `spec-data.ts`, never `eval`): draft them with `npm run draft:prd-writer` (Claude writes, `checkPrdSpecData` validates with several seeds and sends problems back), review the JSON, then run `npm run generate:prd-writer`. Drafting is offline only; nothing calls Claude to build a case while someone plays.
- Shared case UI lives in `src/components` (`OptionCard`, `SubmitDialog`, `RatingDots`) and drafts in `src/lib/draft.ts`; reuse them instead of copying.
- Design system (arcade retro): tokens live in `src/app/globals.css` (dark is the default theme; `--frame` is the 2px card border, `--ink` is accent text that reads in both themes, `--module-<id>` per module). Use `pixel-card` for panels and `pixel-frame` (same frame, no shadow) for dense data such as tables and lists, `shadow-pixel` and `pixel-lift`; hub pages start with `PageHeader`; never `rounded-xl border`; pixel font (`font-pixel`, Jersey 10: chosen because its letters and digits read plainly, and size-adjusted to cap height 0.63 in `globals.css`) only for titles, buttons, numbers and short labels, never for long text; it has one weight, so do not add `font-semibold` to it. Dense data (tickets, dashboards) stays flat. `tests/design/tokens.test.ts` checks WCAG AA for every token pair; see `/styleguide`.
- Game components live in `src/components/arcade` (sprites are character grids in `sprites.ts`). XP, levels, streaks and badges are derived from attempts by `src/core/progress`; never store them. Call `notifyAttemptsChanged()` after saving an attempt so progress views refresh.
- Roadmap & OKRs has no stored JSON: `cases.ts` builds the featured cases from `content/specs.ts` when the module loads. The timeline rules (`planning.ts`) are public and shared by the board and the scoring; the best roadmap is found by exhaustive search in `optimal.ts`, which is why a team has at most four initiatives. `findRoadmapProblem` must pass.
- Quick Cases are built from `content/specs.ts` like Roadmap cases (no JSON). An option's rating may be a function of the case numbers, so the right call changes with the seed; `findQuickProblem` requires a single best answer per step and specs `reject` numbers that are too close to call. It reuses Product Case's `CaseTimer`.
- User Interview replies are rebuilt from the questions on every request (`ask.server.ts` behind the `askInterviewee` Server Action), so nothing is stored and replies never reach the browser in advance. Question reading (`analysis.ts`) is pure regex rules; topic keywords are word stems, with a trailing `$` for whole words. Every topic's `exampleQuestion` must route to that topic at full depth (a test checks it).
- Buttons that switch what one area shows (modes, views, date ranges) use `SegmentedControl` (a radio group), not `Tabs`; `Tabs` are only for options that each have their own `TabsContent` panel.
- Give an element an `aria-label` only when it has no visible text, and make the label start with that text when it has some (axe `label-content-name-mismatch`). Scrolling containers need `tabIndex={0}` and a name. UX Critique mock screens are excluded from axe with `data-mock-screen`: their flaws are the exercise.
- The case page wraps every module in `CaseSession`, which remounts the case after an attempt at it is saved (Next.js keeps visited pages' state, so "Play again" would otherwise reopen the old answer). Learning helpers: `src/lib/recommend.ts` (skill-based next case, used by skills, results and home) and `src/lib/practice.ts` (a fresh generated case of the same module and level).
- Inside a module, build screens from the shared pieces in `src/components/arcade`: every block is a `Panel` (or `PanelTitleBar` for custom layouts; `flat` for dense data), step-by-step answers use `StepTrack`, empty areas use `EmptyState`, and selects use `NativeSelect` (`src/components/ui`). Case and results pages set `world-scope` with `--world` (the module color); use `var(--world-ink)` for accents, never for text.
- Every case workspace registers its objectives and primary action with `useMission` (`src/components/arcade/mission.tsx`); the mission HUD at the bottom of the page is the only place the submit button lives. Call it before any early return.
