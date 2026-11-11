"use client";

/**
 * The case library: every curated case of every world, as level tiles
 * grouped by world, with search, world chips and level and status filters.
 */
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/arcade/empty-state";
import { ModuleSprite, moduleColor } from "@/components/arcade/icons";
import { ModuleScene } from "@/components/arcade/module-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CaseTile } from "@/components/world/case-tile";
import { DIFFICULTIES, type Difficulty } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { bestScores, useAttempts } from "@/lib/use-attempts";
import { cn } from "@/lib/utils";

/** What the library shows about a case. Built on the server from public data. */
export interface CaseSummary {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  company: string;
  industry: string;
  difficulty: Difficulty;
}

type Status = "all" | "new" | "played";
type Level = Difficulty | "all";

export function CaseLibrary({ cases }: { cases: CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.library;
  const { attempts } = useAttempts();
  const best = useMemo(
    () => (attempts ? bestScores(attempts) : new Map<string, number>()),
    [attempts],
  );

  const [query, setQuery] = useState("");
  const [moduleId, setModuleId] = useState("all");
  const [level, setLevel] = useState<Level>("all");
  const [status, setStatus] = useState<Status>("all");
  const [industry, setIndustry] = useState("all");

  const worlds = useMemo(() => {
    const byWorld = new Map<string, { name: string; count: number }>();
    for (const c of cases) {
      const world = byWorld.get(c.moduleId) ?? { name: c.moduleName, count: 0 };
      world.count += 1;
      byWorld.set(c.moduleId, world);
    }
    return [...byWorld].map(([id, world]) => ({ id, ...world }));
  }, [cases]);
  const industries = useMemo(
    () => [...new Set(cases.map((c) => c.industry))].sort(),
    [cases],
  );

  const needle = query.trim().toLowerCase();
  const filtered = cases.filter(
    (c) =>
      (moduleId === "all" || c.moduleId === moduleId) &&
      (level === "all" || c.difficulty === level) &&
      (industry === "all" || c.industry === industry) &&
      (status === "all" ||
        (status === "played" ? best.has(c.id) : !best.has(c.id))) &&
      (needle === "" ||
        [c.title, c.company, c.industry, c.moduleName].some((field) =>
          field.toLowerCase().includes(needle),
        )),
  );
  const groups = worlds
    .map((world) => ({
      ...world,
      cases: filtered.filter((c) => c.moduleId === world.id),
    }))
    .filter((group) => group.cases.length > 0);

  const filtering =
    needle !== "" ||
    moduleId !== "all" ||
    level !== "all" ||
    status !== "all" ||
    industry !== "all";
  const clear = () => {
    setQuery("");
    setModuleId("all");
    setLevel("all");
    setStatus("all");
    setIndustry("all");
  };

  return (
    <div className="space-y-8">
      <section
        aria-label={copy.filters}
        className="pixel-card bg-card/95 z-20 space-y-3 p-3 backdrop-blur lg:sticky lg:top-16"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label={copy.search}
              placeholder={copy.searchPlaceholder}
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <SegmentedControl<Level>
            label={copy.difficulty}
            value={level}
            onValueChange={setLevel}
            options={[
              { value: "all", label: copy.allLevels },
              ...DIFFICULTIES.map((value) => ({
                value,
                label: messages.difficulty[value],
              })),
            ]}
          />
          <SegmentedControl<Status>
            label={copy.status}
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: copy.allStatuses },
              { value: "new", label: copy.notCompleted },
              { value: "played", label: copy.completed },
            ]}
          />
          <NativeSelect
            wrapperClassName="w-auto"
            aria-label={copy.industry}
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
          >
            <option value="all">{copy.allIndustries}</option>
            {industries.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label={copy.module}
            className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] px-1 pr-6 pb-1"
          >
            <WorldChip
              label={copy.allModules}
              count={cases.length}
              pressed={moduleId === "all"}
              onClick={() => setModuleId("all")}
            />
            {worlds.map((world) => (
              <WorldChip
                key={world.id}
                moduleId={world.id}
                label={world.name}
                count={world.count}
                pressed={moduleId === world.id}
                onClick={() =>
                  setModuleId(moduleId === world.id ? "all" : world.id)
                }
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {filtering && (
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                <X aria-hidden="true" />
                {copy.clear}
              </Button>
            )}
            <span
              aria-live="polite"
              className="font-pixel text-muted-foreground text-xs whitespace-nowrap"
            >
              {copy.count(filtered.length, cases.length)}
            </span>
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <EmptyState title={copy.emptyTitle}>
          <p>{copy.empty}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={clear}
          >
            {copy.clear}
          </Button>
        </EmptyState>
      ) : (
        groups.map((group) => {
          const played = group.cases.filter((c) => best.has(c.id)).length;
          return (
            <section
              key={group.id}
              aria-labelledby={`world-${group.id}`}
              className="space-y-3"
            >
              <WorldStrip
                moduleId={group.id}
                titleId={`world-${group.id}`}
                name={group.name}
                summary={copy.worldSummary(group.cases.length, played)}
                openLabel={copy.openWorld}
              />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.cases.map((summary) => (
                  <li key={summary.id}>
                    <CaseTile
                      summary={summary}
                      score={best.get(summary.id)}
                      showLevel
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

/** A toggle for one world, with its sprite and how many cases it has. */
function WorldChip({
  moduleId,
  label,
  count,
  pressed,
  onClick,
}: {
  moduleId?: string;
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={
        moduleId ? { ["--world" as string]: moduleColor(moduleId) } : undefined
      }
      className={cn(
        "world-scope focus-visible:ring-ring/50 flex shrink-0 items-center gap-1.5 rounded-md border-2 px-2 py-1 text-xs whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none",
        pressed
          ? "bg-primary text-primary-foreground border-frame shadow-pixel-sm"
          : "border-border bg-background/60 hover:border-frame text-muted-foreground hover:text-foreground",
      )}
    >
      {moduleId && (
        <span className="rounded-[2px] bg-[#0a0e1f] p-0.5" aria-hidden="true">
          <ModuleSprite moduleId={moduleId} size={14} />
        </span>
      )}
      <span className="font-pixel">{label}</span>
      <span className="tabular-nums opacity-80">{count}</span>
    </button>
  );
}

/** The heading of a world's group: its landscape, name and a link to it. */
function WorldStrip({
  moduleId,
  titleId,
  name,
  summary,
  openLabel,
}: {
  moduleId: string;
  titleId: string;
  name: string;
  summary: string;
  openLabel: string;
}) {
  return (
    <div className="border-frame shadow-pixel-sm relative isolate flex min-h-16 items-center gap-3 overflow-hidden rounded-md border-2 px-3 py-2">
      <ModuleScene
        moduleId={moduleId}
        className="absolute inset-0 -z-10 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0e1f]/90 via-[#0a0e1f]/70 to-[#0a0e1f]/20"
      />
      <span className="rounded-sm bg-[#0a0e1f]/70 p-1" aria-hidden="true">
        <ModuleSprite moduleId={moduleId} size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <h2
          id={titleId}
          className="font-pixel truncate text-lg text-[#eef1ff] [text-shadow:2px_2px_0_#000]"
        >
          {name}
        </h2>
        <p className="text-xs text-[#c9cfee]">{summary}</p>
      </div>
      <Link
        href={`/modules/${moduleId}`}
        className="font-pixel flex shrink-0 items-center gap-1 rounded-sm bg-[#0a0e1f]/70 px-2 py-1 text-xs text-[#eef1ff] hover:underline focus-visible:ring-3 focus-visible:ring-[#ffd23f]/60 focus-visible:outline-none"
      >
        <span className="sr-only sm:not-sr-only">{openLabel}</span>
        <span className="sr-only"> · {name}</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
