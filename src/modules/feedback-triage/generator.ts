/**
 * Builds a Feedback Triage inbox from a case specification and its seed.
 *
 * The code decides everything that is measured: how many items each theme
 * gets, their sources, dates, ratings and scores, and the true ranking. The
 * generator only accepts inboxes that are fair: a clear top three, and, above
 * APM level, a loudest theme that is not the most important one.
 */
import { createRng, type Rng } from "@/core/rng";
import type { Difficulty } from "@/core/case-engine";

import type { ProductSlots, TriageCaseSpec } from "./content/cases";
import {
  DEVICES,
  NOISE_TEXTS,
  PRAISE_TEXT_COUNT,
  THEME_LIBRARY,
} from "./content/themes";
import {
  feedbackTriageCaseSchema,
  type FeedbackItem,
  type FeedbackTriageCase,
  type Severity,
  type Source,
  type ThemeTruth,
} from "./schema";

export const PERIOD_DAYS = 30;
/** The critical problem started this many days before the end of the period. */
export const CRITICAL_WINDOW_DAYS = 6;

interface DifficultyProfile {
  themeSizes: readonly number[];
  criticalItems: number;
  noiseItems: number;
}

export const TRIAGE_PROFILES: Record<Difficulty, DifficultyProfile> = {
  apm: { themeSizes: [12, 9, 8, 6, 5, 4], criticalItems: 5, noiseItems: 6 },
  pm: { themeSizes: [13, 10, 9, 7, 6, 5], criticalItems: 4, noiseItems: 8 },
  senior: {
    themeSizes: [14, 11, 9, 8, 6, 5],
    criticalItems: 3,
    noiseItems: 10,
  },
};

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 10,
};

/** Impact of a theme: how many people times how badly. */
export const themeImpact = (theme: Pick<ThemeTruth, "itemIds" | "severity">) =>
  theme.itemIds.length * SEVERITY_WEIGHT[theme.severity];

const MAX_ATTEMPTS = 200;
/** Third place must beat fourth by this factor for a clear top three. */
const CLEAR_GAP = 1.2;

export function fillSlots(
  text: string,
  slots: ProductSlots,
  rng?: Rng,
): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key === "device") return rng ? rng.pick(DEVICES) : DEVICES[0];
    const value = slots[key as keyof ProductSlots];
    if (value === undefined) throw new Error(`Unknown slot ${match}`);
    return value;
  });
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

interface DraftItem {
  themeKey: string | null;
  severity: Severity | null;
  praise: boolean;
  text: string;
  source: Source;
  daysAgo: number;
}

const SOURCE_MIX: { item: Source; weight: number }[] = [
  { item: "app_review", weight: 0.45 },
  { item: "support", weight: 0.3 },
  { item: "nps", weight: 0.25 },
];

function ratingFor(rng: Rng, item: DraftItem): number {
  if (item.praise) return 5;
  switch (item.severity) {
    case "critical":
    case "high":
      return rng.pick([1, 1, 1, 2]);
    case "medium":
      return rng.pick([1, 2, 2, 3]);
    case "low":
      return rng.pick([2, 3, 3, 4]);
    default:
      return rng.int(1, 5);
  }
}

function npsFor(rng: Rng, item: DraftItem): number {
  if (item.praise) return rng.int(9, 10);
  switch (item.severity) {
    case "critical":
    case "high":
      return rng.int(0, 3);
    case "medium":
      return rng.int(2, 6);
    case "low":
      return rng.int(4, 7);
    default:
      return rng.int(5, 8);
  }
}

/** Why an inbox is unfair to play, or `null`. */
export function findTriageFairnessIssue(
  themes: readonly ThemeTruth[],
  difficulty: Difficulty,
): string | null {
  const ranked = themes.filter((theme) => theme.severity !== "critical");
  const impacts = ranked.map(themeImpact);
  if (impacts[1] < CLEAR_GAP * impacts[2]) {
    return "no clear second most important theme";
  }
  if (difficulty !== "apm") {
    const sizes = ranked.map((theme) => theme.itemIds.length);
    const loudest = sizes.indexOf(Math.max(...sizes));
    if (sizes.filter((size) => size === sizes[loudest]).length > 1) {
      return "two themes are equally loud";
    }
    const minimumRank = difficulty === "senior" ? 2 : 1;
    if (loudest < minimumRank) return "the loudest theme is also the top one";
  }
  return null;
}

export function generateTriageCase(spec: TriageCaseSpec): FeedbackTriageCase {
  const profile = TRIAGE_PROFILES[spec.difficulty];
  if (spec.themes.length !== profile.themeSizes.length) {
    throw new Error(
      `Case "${spec.id}" needs ${profile.themeSizes.length} themes`,
    );
  }
  const problems = new Map<string, number>();
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = createRng(spec.seed).fork(`attempt-${attempt}`);
    const result = buildInbox(spec, profile, rng);
    if (typeof result === "string") {
      problems.set(result, (problems.get(result) ?? 0) + 1);
      continue;
    }
    return result;
  }
  const summary = [...problems.entries()]
    .map(([problem, count]) => `${problem} (${count})`)
    .join("; ");
  throw new Error(`Case "${spec.id}": no fair inbox found: ${summary}`);
}

function buildInbox(
  spec: TriageCaseSpec,
  profile: DifficultyProfile,
  rng: Rng,
): FeedbackTriageCase | string {
  const { slots } = spec;
  const sizes = rng.fork("sizes").shuffle(profile.themeSizes);
  const textRng = rng.fork("texts");
  const metaRng = rng.fork("meta");
  const drafts: DraftItem[] = [];

  const themeDrafts = spec.themes.map((key, index) => {
    const template = THEME_LIBRARY[key];
    const size = sizes[index];
    if (size > template.texts.length) return null;
    const texts = textRng.sample(template.texts, size);
    const items = texts.map((text) => ({
      themeKey: key,
      severity: template.severity,
      praise: false,
      text: fillSlots(text, slots, textRng),
      source: metaRng.weighted(SOURCE_MIX),
      daysAgo: metaRng.int(0, PERIOD_DAYS - 1),
    }));
    drafts.push(...items);
    return { template, items };
  });
  if (themeDrafts.some((entry) => entry === null)) {
    return "a theme has fewer texts than its size";
  }

  const criticalTexts = textRng.sample(
    spec.critical.texts,
    Math.min(profile.criticalItems, spec.critical.texts.length),
  );
  const criticalItems = criticalTexts.map((text) => ({
    themeKey: spec.critical.key,
    severity: "critical" as const,
    praise: false,
    text: fillSlots(text, slots, textRng),
    source: metaRng.bool(0.6)
      ? spec.critical.source
      : metaRng.weighted(SOURCE_MIX),
    daysAgo: metaRng.int(0, CRITICAL_WINDOW_DAYS - 1),
  }));
  drafts.push(...criticalItems);

  const noiseIndexes = textRng.sample(
    NOISE_TEXTS.map((_, index) => index),
    profile.noiseItems,
  );
  const noiseItems = noiseIndexes.map((index) => {
    const praise = index < PRAISE_TEXT_COUNT;
    return {
      themeKey: null,
      severity: null,
      praise,
      text: fillSlots(NOISE_TEXTS[index], slots, textRng),
      source: (praise && metaRng.bool(0.4) ? "nps" : "app_review") as Source,
      daysAgo: metaRng.int(0, PERIOD_DAYS - 1),
    };
  });
  drafts.push(...noiseItems);

  // Oldest first gets FB-001; same-day items are shuffled.
  const ordered = rng
    .fork("order")
    .shuffle(drafts)
    .sort((a, b) => b.daysAgo - a.daysAgo);
  const idOf = new Map<DraftItem, string>();
  const items: FeedbackItem[] = ordered.map((draft, index) => {
    const id = `FB-${String(index + 1).padStart(3, "0")}`;
    idOf.set(draft, id);
    const item: FeedbackItem = {
      id,
      source: draft.source,
      date: addDays(spec.periodEnd, -draft.daysAgo),
      text: draft.text,
    };
    if (draft.source === "app_review") item.rating = ratingFor(metaRng, draft);
    if (draft.source === "nps") item.npsScore = npsFor(metaRng, draft);
    if (draft.source === "support") {
      item.plan = metaRng.bool(0.55) ? slots.plan : "Free";
    }
    return item;
  });

  const critical: ThemeTruth = {
    key: spec.critical.key,
    label: spec.critical.label,
    severity: "critical",
    itemIds: criticalItems.map((draft) => idOf.get(draft)!),
    summary: spec.critical.summary,
    opportunity: spec.critical.opportunity,
  };
  const others: ThemeTruth[] = themeDrafts.map((entry) => {
    const { template, items: themeItems } = entry!;
    return {
      key: template.key,
      label: fillSlots(template.label, slots),
      severity: template.severity,
      itemIds: themeItems.map((draft) => idOf.get(draft)!),
      summary: fillSlots(template.summary, slots),
      opportunity: fillSlots(template.opportunity, slots),
    };
  });
  others.sort(
    (a, b) =>
      themeImpact(b) - themeImpact(a) ||
      SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] ||
      a.key.localeCompare(b.key),
  );
  const themes = [critical, ...others];

  const unfair = findTriageFairnessIssue(themes, spec.difficulty);
  if (unfair) return unfair;

  const loudest = [...others].sort(
    (a, b) => b.itemIds.length - a.itemIds.length,
  )[0];
  const [, second, third] = themes;
  const explanation = [
    `The critical problem, "${critical.label}", appears in only ${critical.itemIds.length} items, all from the last ${CRITICAL_WINDOW_DAYS} days. Few items, but each describes harm that grows every day it stays live, so it goes first whatever the volume.`,
    loudest.key === second.key
      ? `After it, "${second.label}" is both the loudest theme (${second.itemIds.length} items) and the one with the most impact.`
      : `Volume alone would put "${loudest.label}" next, with ${loudest.itemIds.length} items, but it is a ${loudest.severity}-severity problem. "${second.label}" (${second.itemIds.length} items, ${second.severity} severity) and "${third.label}" (${third.itemIds.length} items, ${third.severity} severity) hurt more people more.`,
    `Impact here is reach times severity: low counts 1, medium 2, high 3 per item. ${noiseItems.length} items were noise: praise, spam and off-topic messages that belong in no theme.`,
  ].join(" ");

  return feedbackTriageCaseSchema.parse({
    id: spec.id,
    moduleId: "feedback-triage",
    seed: spec.seed,
    difficulty: spec.difficulty,
    company: spec.company,
    title: spec.title,
    brief: `${spec.company.name}'s inbox for the last ${PERIOD_DAYS} days holds ${items.length} pieces of feedback: app reviews, support tickets and NPS comments. The PM who used to triage it has left, and the team plans the next quarter on Monday. Group the feedback into themes, set the noise aside, flag anything critical, rank the themes by what matters, and write opportunities for the top ones.`,
    period: {
      from: addDays(spec.periodEnd, -(PERIOD_DAYS - 1)),
      to: spec.periodEnd,
    },
    items,
    hidden: {
      themes,
      noiseItemIds: noiseItems.map((draft) => idOf.get(draft)!),
      explanation,
      principle:
        "Rank feedback by reach times severity, not by volume, and read the rare, recent and severe items first: a critical problem is usually quiet before it gets loud.",
    },
  });
}
