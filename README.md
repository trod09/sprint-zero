# Sprint Zero

Interactive product management simulations. Each case hides a ground truth,
the official score is computed by code (same answer, same score), and an AI
coach adds qualitative feedback on top.

Playable today:

- **Backlog Simulator**: plan a sprint from a 20–40 ticket backlog full of
  traps (duplicates, single-customer requests, vanity work, critical bugs filed
  as minor), survive a mid-sprint event, and compare your sprint with the best
  possible one. 10 cases.
- **Metric Drop**: a metric fell this week. Investigate it in an
  Amplitude-style dashboard over synthetic data, tell the root cause from the
  false leads, and recommend a next step. 5 cases.

## Getting started

Requirements: Node 20 or later (developed on Node 24) and npm.

```bash
npm install
cp .env.example .env.local   # optional: only needed for AI feedback
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable            | Required | Purpose                                                                |
| ------------------- | -------- | ---------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | No       | Enables the AI coach on results pages and `--rewrite` in case scripts. |
| `ANTHROPIC_MODEL`   | No       | Model for AI calls. Defaults to `claude-sonnet-5-5`.                   |

Without a key everything works except the AI coach, which shows a short
notice instead. Keys are only read on the server.

## Scripts

| Command                        | What it does                                        |
| ------------------------------ | --------------------------------------------------- |
| `npm run dev`                  | Development server                                  |
| `npm run check`                | Lint, typecheck and tests (run before every commit) |
| `npm run build` / `npm start`  | Production build and server                         |
| `npm run format`               | Prettier                                            |
| `npm run generate:backlog`     | Rebuild the 10 Backlog Simulator cases              |
| `npm run generate:metric-drop` | Rebuild the 5 Metric Drop cases                     |

### Generating cases

Cases are generated from code and committed as JSON. Never edit the JSON by
hand: change the source and regenerate. A test fails if the committed JSON is
out of date, and both scripts accept `-- --check` to verify without writing.

- **Backlog Simulator**: `src/modules/backlog/content/` holds the hand-written
  companies, ticket templates and events; `case-specs.ts` lists the 10 cases
  (company, difficulty, seed, events). The seeded generator picks tickets,
  sets every number and only accepts cases that are fair to play.
  `npm run generate:backlog -- --rewrite` optionally polishes ticket wording
  with Claude; rewrites that change any number are discarded.
- **Metric Drop**: `src/modules/metric-drop/content/cases.ts` holds 5 case
  specifications (scale, release, timeline, root cause and false leads as
  anomalies). The data itself is not stored: the server regenerates a 75-day
  cube from the seed, and the browser only receives the views it asks for.

## How it works

```
src/
  app/                 routes: home, /modules/[module], /case/[caseId],
                       /results/[attemptId], /library, /history
  core/
    case-engine/       module contract, registry, case repository, scoring
                       on submit, AI feedback
    scoring/           buildScoreResult and helpers (weights add up to 100)
    rng/               seeded generator (mulberry32); no Math.random
    ai/                Claude client: schema-constrained output, Zod
                       validation, one corrective retry
    storage/           attempts in localStorage behind an async interface
  modules/
    backlog/           schema, generator, optimal sprint, scoring, UI
    metric-drop/       schema, data generator, queries, scoring, UI
```

- **Ground truth stays on the server.** Cases are read only through
  `server-only` modules. The browser gets public views; the full case is
  returned only after an answer is submitted.
- **Scores are deterministic.** Scoring runs in the `submitAttempt` Server
  Action. The browser stores the answer and the score; results pages re-score
  the stored answer, so they always match the current rules.
- **The LLM writes words, never numbers.** It does not decide any score. Its
  feedback is constrained to a JSON schema, validated with Zod, and receives
  learner text inside a fenced block as untrusted data.

### Adding a module

1. `src/modules/<id>/module.ts` with the client-safe metadata, and an entry
   in `src/modules/catalog.ts`.
2. A `SimulationModule` (schemas, `toPublicCase`, deterministic `score`,
   feedback rubric) registered in `src/modules/registry.server.ts`.
3. Its case view in `src/modules/case-view.tsx` and results view in
   `src/modules/results-view.tsx`.

`src/core` does not change.

## Deploying to Vercel

The app needs no database in Phase 1, so it deploys as a standard Next.js
project:

1. Push the repository to GitHub.
2. In Vercel, import the repository. The defaults (framework Next.js,
   `npm run build`) are correct.
3. Optionally add `ANTHROPIC_API_KEY` (and `ANTHROPIC_MODEL`) under
   Settings → Environment Variables to enable the AI coach.

Or from the terminal with the Vercel CLI: `npx vercel` for a preview and
`npx vercel --prod` for production.

## Project plan

`MASTER_PROMPT.md` describes the product, the architecture and the phased
plan. Phase 1 (this version) covers the core, the Backlog Simulator and
Metric Drop, without accounts. Accounts, more modules and automatic case
generation come in Phase 2.
