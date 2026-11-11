"use client";

/**
 * The skills page as a character sheet: the player's totals and Kanbo's
 * advice, a stat card per skill, the radar, what to practise next, the
 * ratings over time and how the rating works.
 */
import Link from "next/link";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/arcade/empty-state";
import { ModuleSprite, PixelIcon } from "@/components/arcade/icons";
import { MascotBubble } from "@/components/arcade/mascot-bubble";
import { Panel } from "@/components/arcade/panel";
import type { IconName } from "@/components/arcade/sprites";
import type { CaseSummary } from "@/components/case-library";
import { Button } from "@/components/ui/button";
import { CaseTile } from "@/components/world/case-tile";
import { SKILLS, type ModuleMeta, type Skill } from "@/core/case-engine";
import {
  computeSkillRatings,
  firstAttempts,
  ratingToLevel,
  recommendCases,
  START_RATING,
  type Recommendation,
  type SkillRating,
} from "@/core/skills";
import { getMessages } from "@/i18n";
import { ratedAttemptsFrom } from "@/lib/recommend";
import { bestScores, useAttempts } from "@/lib/use-attempts";
import { cn } from "@/lib/utils";
import { moduleCatalog } from "@/modules/catalog";

/** Theme tokens, so the charts follow light and dark mode. */
const SKILL_COLORS: Record<Skill, string> = {
  execution: "var(--chart-1)",
  analytics: "var(--chart-2)",
  product_sense: "var(--chart-3)",
  communication: "var(--chart-4)",
  strategy: "var(--chart-5)",
};

const SKILL_ICONS: Record<Skill, IconName> = {
  execution: "list",
  analytics: "chart",
  product_sense: "bulb",
  communication: "chat",
  strategy: "flag",
};

/** Level thresholds of each rank, highest first. */
const RANKS = [
  { min: 90, key: "master" },
  { min: 70, key: "expert" },
  { min: 50, key: "strong" },
  { min: 30, key: "rising" },
  { min: 0, key: "rookie" },
] as const;

const BLOCKS = 10;

const rankFor = (level: number) => RANKS.find((rank) => level >= rank.min)!.key;

const tooltipStyle = {
  background: "var(--popover)",
  border: "2px solid var(--frame)",
  borderRadius: 6,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function SkillsDashboard({ cases }: { cases: CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.skillsPage;
  const { attempts } = useAttempts();

  const skillsOf = useMemo(
    () => new Map(moduleCatalog.map((meta) => [meta.id, meta.skills])),
    [],
  );
  const caseById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);
  /** Playable worlds that train each skill. */
  const worldsFor = useMemo(() => {
    const playable = new Set(cases.map((c) => c.moduleId));
    return Object.fromEntries(
      SKILLS.map((skill) => [
        skill,
        moduleCatalog.filter(
          (meta) => playable.has(meta.id) && meta.skills.includes(skill),
        ),
      ]),
    ) as unknown as Record<Skill, readonly ModuleMeta[]>;
  }, [cases]);

  const view = useMemo(() => {
    if (!attempts) return null;
    const rated = ratedAttemptsFrom(attempts, caseById);
    const ratings = computeSkillRatings(rated);
    const recommendations = recommendCases(
      ratings,
      cases.map((c) => ({
        id: c.id,
        moduleId: c.moduleId,
        difficulty: c.difficulty,
        skills: skillsOf.get(c.moduleId) ?? [],
      })),
      new Set(attempts.map((a) => a.caseId)),
      SKILLS.length,
    );
    const firsts = firstAttempts(rated);
    // One row per counted case with every skill's rating at that point.
    const start: Record<string, number | string> = { index: 0 };
    for (const skill of SKILLS) start[skill] = START_RATING;
    const trend = [
      start,
      ...firsts.map((attempt, index) => {
        const row: Record<string, number | string> = { index: index + 1 };
        for (const skill of SKILLS) {
          const point = [...ratings[skill].history]
            .reverse()
            .find((p) => p.date <= attempt.submittedAt);
          if (point) row[skill] = point.rating;
        }
        return row;
      }),
    ];
    return {
      ratings,
      recommendations,
      counted: firsts.length,
      trend,
      best: bestScores(attempts),
    };
  }, [attempts, caseById, cases, skillsOf]);

  if (!view) {
    return (
      <p role="status" className="text-muted-foreground py-10 text-sm">
        {copy.loading}
      </p>
    );
  }

  const practiced = SKILLS.filter((s) => view.ratings[s].attempts > 0);
  const overall =
    practiced.length === 0
      ? null
      : Math.round(
          practiced.reduce(
            (total, skill) => total + ratingToLevel(view.ratings[skill].rating),
            0,
          ) / practiced.length,
        );
  const recommendationFor = new Map(
    view.recommendations.map((rec) => [rec.skill, rec]),
  );
  const focus = view.recommendations[0];
  const focusCase = focus && caseById.get(focus.caseId);

  const radarData = SKILLS.map((skill) => ({
    skill: messages.skills[skill],
    level: ratingToLevel(view.ratings[skill].rating),
  }));

  const stats = [
    {
      icon: "level" as const,
      label: copy.stats.overall,
      value: overall === null ? "–" : String(overall),
    },
    {
      icon: "check" as const,
      label: copy.stats.skills,
      value: `${practiced.length}/${SKILLS.length}`,
    },
    {
      icon: "star" as const,
      label: copy.stats.cases,
      value: String(view.counted),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="space-y-5">
          <header className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="border-frame bg-card shadow-pixel-sm mt-1 flex size-12 shrink-0 items-center justify-center rounded-md border-2"
            >
              <PixelIcon name="level" size={28} />
            </span>
            <div className="min-w-0">
              <h1 className="font-pixel text-3xl leading-tight text-balance">
                {copy.title}
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
                {copy.subtitle}
              </p>
            </div>
          </header>
          <dl className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="pixel-card px-3 py-2.5">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <PixelIcon name={stat.icon} size={12} />
                  {stat.label}
                </dt>
                <dd className="font-pixel mt-1 text-2xl tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <MascotBubble label={copy.kanbo.label} size={64}>
          <div className="space-y-2">
            <p className="text-sm">
              {view.counted === 0
                ? copy.kanbo.first
                : focus
                  ? copy.kanbo.focus(messages.skills[focus.skill])
                  : copy.kanbo.done}
            </p>
            {focusCase && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold">
                  {focusCase.title}
                  <span className="text-muted-foreground block text-xs font-normal">
                    {focusCase.moduleName} ·{" "}
                    {messages.difficulty[focusCase.difficulty]}
                  </span>
                </p>
                <Button asChild size="sm">
                  <Link href={`/case/${focusCase.id}`}>
                    {copy.play}
                    <PixelIcon name="play" size={12} />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </MascotBubble>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <section aria-labelledby="sheet-title" className="space-y-3">
          <h2 id="sheet-title" className="font-pixel text-2xl">
            {copy.sheetTitle}
          </h2>
          <ul className="space-y-3">
            {SKILLS.map((skill) => (
              <SkillCard
                key={skill}
                skill={skill}
                entry={view.ratings[skill]}
                worlds={worldsFor[skill]}
                recommendation={recommendationFor.get(skill)}
              />
            ))}
          </ul>
        </section>

        <div className="space-y-6 lg:sticky lg:top-20">
          <Panel id="radar-title" icon="target" title={copy.radarTitle}>
            <figure aria-label={copy.radarLabel} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="var(--frame)" strokeOpacity={0.5} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="level"
                    name={copy.level}
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="var(--primary)"
                    fillOpacity={0.25}
                    dot={{ r: 3, fill: "var(--primary)" }}
                    isAnimationActive={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </figure>
            {view.counted === 0 && (
              <p className="text-muted-foreground text-center text-xs">
                {copy.radarEmpty}
              </p>
            )}
          </Panel>

          <Panel icon="doc" title={copy.howTitle}>
            <ul className="space-y-2 text-sm">
              {copy.how.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span aria-hidden="true" className="text-ink mt-0.5">
                    <PixelIcon name="play" size={10} />
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>
            <ol className="mt-3 flex flex-wrap gap-1.5">
              {[...RANKS].reverse().map((rank) => (
                <li
                  key={rank.key}
                  className="font-pixel border-frame bg-background/60 rounded-sm border-2 px-1.5 py-0.5 text-[0.625rem] tracking-wider uppercase"
                >
                  {copy.ranks[rank.key]} {rank.min}+
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Panel
        id="next-title"
        icon="play"
        title={copy.nextTitle}
        subtitle={copy.nextIntro}
      >
        {view.recommendations.length === 0 ? (
          <EmptyState size="sm" title={copy.nextEmptyTitle}>
            {copy.nextEmpty}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.recommendations.slice(0, 3).map((rec) => {
              const summary = caseById.get(rec.caseId);
              if (!summary) return null;
              const skillName = messages.skills[rec.skill];
              return (
                <li key={rec.caseId} className="flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-xs">
                    <span
                      aria-hidden="true"
                      style={{ color: SKILL_COLORS[rec.skill] }}
                    >
                      <PixelIcon name={SKILL_ICONS[rec.skill]} size={12} />
                    </span>
                    <span className="text-muted-foreground">
                      {copy.reasons[rec.reason](skillName)}
                    </span>
                  </p>
                  <div className="flex-1">
                    <CaseTile
                      summary={summary}
                      score={view.best.get(summary.id)}
                      showLevel
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel id="trend-title" icon="chart" title={copy.trendTitle}>
        {view.counted === 0 ? (
          <EmptyState size="sm" title={copy.trendEmptyTitle}>
            {copy.trendEmpty}
          </EmptyState>
        ) : (
          <figure aria-label={copy.trendLabel} className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={view.trend}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="index"
                  tickFormatter={(value: number) => copy.caseNumber(value)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  stroke="var(--border)"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  stroke="var(--border)"
                  width={48}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(value) => copy.caseNumber(Number(value))}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => (
                    <span style={{ color: "var(--foreground)" }}>{value}</span>
                  )}
                />
                {practiced.map((skill) => (
                  <Line
                    key={skill}
                    type="linear"
                    dataKey={skill}
                    name={messages.skills[skill]}
                    stroke={SKILL_COLORS[skill]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </figure>
        )}
      </Panel>
    </div>
  );
}

/** One skill as a stat card: level, rank, blocks, change and where to train. */
function SkillCard({
  skill,
  entry,
  worlds,
  recommendation,
}: {
  skill: Skill;
  entry: SkillRating;
  worlds: readonly ModuleMeta[];
  recommendation?: Recommendation;
}) {
  const messages = getMessages();
  const copy = messages.skillsPage;
  const practiced = entry.attempts > 0;
  const level = ratingToLevel(entry.rating);
  const filled = practiced ? Math.round((level / 100) * BLOCKS) : 0;
  const history = entry.history;
  const previous =
    history.length > 1 ? history[history.length - 2].rating : START_RATING;
  const delta = practiced ? entry.rating - previous : 0;
  const color = SKILL_COLORS[skill];

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-md border-2 p-4 sm:flex-row sm:items-center",
        practiced
          ? "pixel-card"
          : "border-border bg-background/60 border-dashed",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span
          aria-hidden="true"
          className="bg-background flex size-12 shrink-0 items-center justify-center rounded-md border-2"
          style={{ borderColor: color, color }}
        >
          <PixelIcon name={SKILL_ICONS[skill]} size={24} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-pixel text-base">
              {messages.skills[skill]}
              {practiced && (
                <span className="text-muted-foreground ml-2 text-xs">
                  {copy.ranks[rankFor(level)]}
                </span>
              )}
            </h3>
            <p className="font-pixel text-2xl leading-none tabular-nums">
              {practiced ? level : "–"}
              <span className="text-muted-foreground ml-1 text-xs">
                {copy.levelShort}
              </span>
            </p>
          </div>
          <div
            className="flex h-3 gap-0.5"
            role="img"
            aria-label={
              practiced ? copy.levelOf(level) : copy.attempts(entry.attempts)
            }
          >
            {Array.from({ length: BLOCKS }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-[1px]",
                  index >= filled && "bg-muted",
                )}
                style={index < filled ? { background: color } : undefined}
              />
            ))}
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{copy.attempts(entry.attempts)}</span>
            {practiced && (
              <span className="tabular-nums">
                {copy.rating} {entry.rating}
              </span>
            )}
            {practiced && delta !== 0 && (
              <span
                className={cn(
                  "font-pixel tabular-nums",
                  delta > 0 ? "text-success" : "text-destructive",
                )}
              >
                {copy.delta(delta)}
              </span>
            )}
            {worlds.length > 0 ? (
              <span className="flex items-center gap-1">
                {copy.trainedBy}
                {worlds.map((meta) => (
                  <Link
                    key={meta.id}
                    href={`/modules/${meta.id}`}
                    title={meta.name}
                    className="focus-visible:ring-ring/50 rounded-[2px] bg-[#0a0e1f] p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <ModuleSprite moduleId={meta.id} size={14} />
                    <span className="sr-only">{meta.name}</span>
                  </Link>
                ))}
              </span>
            ) : (
              <span>{copy.noModule}</span>
            )}
          </p>
        </div>
      </div>
      {recommendation && (
        <Button
          asChild
          size="sm"
          variant={practiced ? "outline" : "default"}
          className="ml-16 self-start sm:ml-0 sm:self-center"
        >
          <Link href={`/case/${recommendation.caseId}`}>
            {copy.train}
            <span className="sr-only"> {messages.skills[skill]}</span>
            <PixelIcon name="play" size={12} />
          </Link>
        </Button>
      )}
    </li>
  );
}
