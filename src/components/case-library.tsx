"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Status = "all" | "completed" | "not_completed";

const selectClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30";

export function CaseLibrary({
  cases,
  showModuleFilter = true,
}: {
  cases: CaseSummary[];
  /** Hidden on a module's own page, where every case is from that module. */
  showModuleFilter?: boolean;
}) {
  const messages = getMessages();
  const copy = messages.library;
  const { attempts } = useAttempts();
  const best = attempts ? bestScores(attempts) : new Map<string, number>();

  const [moduleId, setModuleId] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [status, setStatus] = useState<Status>("all");

  const modules = [...new Map(cases.map((c) => [c.moduleId, c.moduleName]))];
  const industries = [...new Set(cases.map((c) => c.industry))].sort();
  const filtered = cases.filter(
    (c) =>
      (moduleId === "all" || c.moduleId === moduleId) &&
      (industry === "all" || c.industry === industry) &&
      (difficulty === "all" || c.difficulty === difficulty) &&
      (status === "all" ||
        (status === "completed" ? best.has(c.id) : !best.has(c.id))),
  );
  const filtering =
    moduleId !== "all" ||
    industry !== "all" ||
    difficulty !== "all" ||
    status !== "all";

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={copy.filters}
        className="flex flex-wrap items-center gap-2"
      >
        {showModuleFilter && modules.length > 1 && (
          <select
            aria-label={copy.module}
            className={selectClassName}
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
          >
            <option value="all">{copy.allModules}</option>
            {modules.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label={copy.industry}
          className={selectClassName}
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
        >
          <option value="all">{copy.allIndustries}</option>
          {industries.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          aria-label={copy.difficulty}
          className={selectClassName}
          value={difficulty}
          onChange={(event) =>
            setDifficulty(
              DIFFICULTIES.find((d) => d === event.target.value) ?? "all",
            )
          }
        >
          <option value="all">{copy.allDifficulties}</option>
          {DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {messages.difficulty[value]}
            </option>
          ))}
        </select>
        <select
          aria-label={copy.status}
          className={selectClassName}
          value={status}
          onChange={(event) => setStatus(event.target.value as Status)}
        >
          <option value="all">{copy.allStatuses}</option>
          <option value="completed">{copy.completed}</option>
          <option value="not_completed">{copy.notCompleted}</option>
        </select>
        {filtering && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setModuleId("all");
              setIndustry("all");
              setDifficulty("all");
              setStatus("all");
            }}
          >
            <X aria-hidden="true" />
            {copy.clear}
          </Button>
        )}
        <span
          aria-live="polite"
          className="text-muted-foreground ml-auto text-xs"
        >
          {copy.count(filtered.length, cases.length)}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
          {copy.empty}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {filtered.map((summary) => {
            const score = best.get(summary.id);
            return (
              <li key={summary.id}>
                <Link
                  href={`/case/${summary.id}`}
                  className="group hover:bg-muted/50 focus-visible:ring-ring/50 flex items-center justify-between gap-4 px-4 py-3 transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{summary.title}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {showModuleFilter && `${summary.moduleName} · `}
                      {summary.company} · {summary.industry}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {score !== undefined && (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums",
                          score >= 80
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {copy.best(score)}
                      </span>
                    )}
                    <Badge variant="outline">
                      {messages.difficulty[summary.difficulty]}
                    </Badge>
                    <ArrowRight
                      className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
