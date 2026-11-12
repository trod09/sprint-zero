# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: candidates preparing for APM and PM roles, including people moving into product from other careers. They practise on their own, usually at a desk, in short focused sessions before interviews or while job hunting. Their job is to build and prove product judgement (prioritising, reading metrics, interpreting experiments, writing one-pagers) by doing it, not by watching videos or memorising frameworks.

Other audiences named in MASTER_PROMPT.md but not designed for yet: working junior PMs, master's and bootcamp students, and companies using the cases as a practical test in hiring (B2B, later phase).

## Product Purpose

Sprint Zero is a practice gym for product management: interactive simulations, the PM equivalent of consulting mock cases. Each case has a hidden ground truth and is scored by fixed rules, so the learner sees exactly why they got their score, criterion by criterion, then reads the explained solution and qualitative feedback from an AI coach.

Success means a learner plays a case end to end (brief, simulation, submit, results), understands their mistakes from the breakdown, and comes back to practise the skills where they are weakest.

## Positioning

Practice by doing, with consequences and consistent judgement. Scores are deterministic: the same case and the same answer always give the same score, computed by code from a hidden ground truth, never by the AI. The AI coach only explains the score and never changes it. The numbers in every case come from seeded generators, so cases can be generated on demand without an AI inventing data.

## Operating Context

- Flow of every case: Brief, then Simulation, then Submit, then Results (score, breakdown, AI feedback, explained solution).
- Ten playable modules: Product Case, Backlog Simulator, Metric Drop, A/B Test Interpreter, User Interview Simulator, Feedback Triage, PRD Writer, Roadmap & OKRs, UX Critique, Quick Cases. Stakeholder Arena and Career mode are planned, not built.
- Learners pick cases from the case library or a module's world, by industry pack (fintech, marketplace, B2B SaaS, consumer) and level (APM, PM, Senior), or play the daily case.
- Progress (XP, levels, streaks, badges, the skills sheet) is derived from the learner's attempts; until accounts exist it lives in the browser.
- Desktop first: it is a serious practice tool, responsive down to phones.

## Capabilities and Constraints

- Ground truth never reaches the browser before submit; scoring runs on the server.
- Numbers come from code, never from the AI. Scores are reproducible.
- The AI coach is optional: everything except qualitative feedback works without an API key.
- Accounts (Supabase: magic link and Google, no passwords) are planned for Phase 2. Until then the sign-in page says so and offers guest play.
- Interface copy is English (international market), structured for i18n so Spanish can follow. The project owner works in Spanish.
- Business model: freemium is planned (part free, a paid plan later). Plans, prices and what is paid are undecided; nothing may promise prices or paid features yet.

## Brand Commitments

- Name: Sprint Zero (provisional per MASTER_PROMPT.md, in use across the product).
- Mascot: Kanbo, the pixel character who greets the learner.
- Voice: plain, direct English addressing the learner as "you"; specific rather than generic; game language (worlds, levels, XP, "press start") around the cases, professional language inside them.
- Honesty about scoring is part of the brand: the footer states "Scores are deterministic. AI feedback complements the score and never changes it."

## Evidence on Hand

- No users, testimonials, metrics, logos or press exist yet. No surface may show user counts, quotes, ratings, customer logos or outcome claims until real ones exist.
- Real, showable facts: the playable modules and their cases, the number of cases and skills computed by the app, and the scoring and AI-feedback rules above.

## Product Principles

1. Learn by doing: every screen moves the learner toward making a decision and seeing its consequence.
2. The score is the truth: deterministic, explained criterion by criterion, never overridden by the AI.
3. Fair cases: every case has one defensible best answer that the information on screen justifies.
4. Never fabricate: no invented data in cases (numbers come from seeds) and no invented proof on the product's own pages.
5. Come back tomorrow: progress, streaks and recommendations point the learner at the next case that trains their weakest skill.

## Accessibility & Inclusion

WCAG 2.1 AA is enforced: every page is checked with axe (serious and critical violations fail the build) on desktop in dark and light themes and on a phone, every colour token pair is tested for AA contrast, and pages must not scroll sideways. Reading text never uses the pixel display font.
