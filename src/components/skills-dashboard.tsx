"use client";

import { ArrowRight } from "lucide-react";
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

import type { CaseSummary } from "@/components/case-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKILLS, type Skill } from "@/core/case-engine";
import {
  computeSkillRatings,
  firstAttempts,
  ratingToLevel,
  START_RATING,
  recommendCases,
  type RatedAttempt,
} from "@/core/skills";
import { getMessages } from "@/i18n";
import { useAttempts } from "@/lib/use-attempts";
import { moduleCatalog } from "@/modules/catalog";

const SKILL_COLORS: Record<Skill, string> = {
  execution: "#6366f1",
  analytics: "#0ea5e9",
  product_sense: "#f59e0b",
  communication: "#10b981",
  strategy: "#ef4444",
};

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
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
  const trained = useMemo(() => {
    const playable = new Set(cases.map((c) => c.moduleId));
    return new Set(
      moduleCatalog
        .filter((meta) => playable.has(meta.id))
        .flatMap((meta) => meta.skills),
    );
  }, [cases]);
  const caseById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);

  const view = useMemo(() => {
    if (!attempts) return null;
    const rated: RatedAttempt[] = attempts.flatMap((attempt) => {
      const summary = caseById.get(attempt.caseId);
      const skills = skillsOf.get(attempt.moduleId);
      if (!summary || !skills) return [];
      return [
        {
          caseId: attempt.caseId,
          skills,
          difficulty: summary.difficulty,
          score: attempt.result.total,
          submittedAt: attempt.submittedAt,
        },
      ];
    });
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
    return { ratings, recommendations, counted: firsts.length, trend };
  }, [attempts, caseById, cases, skillsOf]);

  if (!view) {
    return (
      <p role="status" className="text-muted-foreground py-10 text-sm">
        {copy.loading}
      </p>
    );
  }

  const radarData = SKILLS.map((skill) => ({
    skill: messages.skills[skill],
    level: ratingToLevel(view.ratings[skill].rating),
  }));
  const practicedSkills = SKILLS.filter((s) => view.ratings[s].attempts > 0);

  return (
    <div className="space-y-6">
      {view.counted === 0 && (
        <div className="rounded-xl border border-dashed px-6 py-8 text-center">
          <p className="text-muted-foreground">{copy.empty}</p>
          <Button asChild className="mt-4">
            <Link href="/library">{copy.emptyCta}</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="radar-title"
          className="bg-card rounded-xl border p-5"
        >
          <h2 id="radar-title" className="font-heading font-semibold">
            {copy.radarTitle}
          </h2>
          <figure aria-label={copy.radarLabel} className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="level"
                  name={copy.level}
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </figure>
        </section>

        <section
          aria-labelledby="skills-table-title"
          className="bg-card rounded-xl border p-5"
        >
          <h2 id="skills-table-title" className="sr-only">
            {copy.rating}
          </h2>
          <ul className="divide-y">
            {SKILLS.map((skill) => {
              const entry = view.ratings[skill];
              return (
                <li key={skill} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: SKILL_COLORS[skill] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{messages.skills[skill]}</p>
                    <p className="text-muted-foreground text-xs">
                      {trained.has(skill)
                        ? copy.attempts(entry.attempts)
                        : copy.noModule}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg tabular-nums">
                      {entry.attempts === 0 ? "—" : ratingToLevel(entry.rating)}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {copy.rating} {entry.rating}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section
        aria-labelledby="next-title"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="next-title" className="font-heading font-semibold">
          {copy.nextTitle}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{copy.nextIntro}</p>
        {view.recommendations.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">{copy.nextEmpty}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {view.recommendations.map((rec) => {
              const summary = caseById.get(rec.caseId);
              if (!summary) return null;
              const skillName = messages.skills[rec.skill];
              return (
                <li
                  key={rec.caseId}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="secondary">{skillName}</Badge>
                    <Badge variant="outline">
                      {messages.difficulty[summary.difficulty]}
                    </Badge>
                  </div>
                  <p className="font-medium">{summary.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {summary.moduleName} · {copy.reasons[rec.reason](skillName)}
                  </p>
                  <Button asChild size="sm" className="mt-auto self-start">
                    <Link href={`/case/${summary.id}`}>
                      {copy.play}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="trend-title"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="trend-title" className="font-heading font-semibold">
          {copy.trendTitle}
        </h2>
        {view.counted === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {copy.trendEmpty}
          </p>
        ) : (
          <figure aria-label={copy.trendLabel} className="mt-2 h-72 w-full">
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
                {practicedSkills.map((skill) => (
                  <Line
                    key={skill}
                    type="linear"
                    dataKey={skill}
                    name={messages.skills[skill]}
                    stroke={SKILL_COLORS[skill]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </figure>
        )}
      </section>

      <section className="text-muted-foreground text-sm">
        <h2 className="text-foreground font-medium">{copy.howTitle}</h2>
        <p className="mt-1 max-w-3xl leading-relaxed">{copy.how}</p>
      </section>
    </div>
  );
}
