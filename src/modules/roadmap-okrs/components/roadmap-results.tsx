"use client";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { evaluatePlan } from "../planning";
import type { RoadmapCase } from "../schema";
import type { RoadmapReport } from "../scoring";
import { Timeline } from "./timeline";

const RATING_STYLE = ["text-destructive", "text-warning", "text-success"];

export function RoadmapResults({
  caseData,
  report,
}: {
  caseData: RoadmapCase;
  report: RoadmapReport;
}) {
  const copy = getMessages().roadmap;
  const { hidden, initiatives, teams, objectives } = caseData;
  const keyResultText = new Map(caseData.keyResults.map((k) => [k.id, k.text]));
  const keyResultWhy = new Map(hidden.keyResults.map((k) => [k.id, k.why]));
  const initiative = new Map(initiatives.map((i) => [i.id, i]));
  const initiativeWhy = new Map(hidden.initiatives.map((i) => [i.id, i.why]));
  const objectiveTitle = new Map(objectives.map((o) => [o.id, o.title]));

  const yours = evaluatePlan(
    initiatives,
    report.initiatives.flatMap((i) =>
      i.startSprint === null
        ? []
        : [{ initiativeId: i.id, startSprint: i.startSprint }],
    ),
  );
  const best = evaluatePlan(initiatives, report.optimalSchedule);

  return (
    <div className="space-y-6">
      <section aria-labelledby="results-roadmaps" className="pixel-card p-4">
        <h2 id="results-roadmaps" className="font-heading font-semibold">
          {copy.results.yourRoadmap}
        </h2>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">
          {copy.results.value(report.deliveredValue, report.optimalValue)}
        </p>
        <Timeline
          teams={teams}
          initiatives={initiatives}
          items={yours.items}
          labelledBy="results-roadmaps"
        />
        <h3
          id="results-best"
          className="font-heading mt-6 mb-3 border-t pt-4 font-semibold"
        >
          {copy.results.bestRoadmap}
        </h3>
        <Timeline
          teams={teams}
          initiatives={initiatives}
          items={best.items}
          labelledBy="results-best"
        />
      </section>

      <section aria-labelledby="results-krs" className="pixel-card p-4">
        <h2 id="results-krs" className="font-heading font-semibold">
          {copy.results.keyResults}
        </h2>
        <div className="mt-3 space-y-5">
          {objectives.map((objective) => (
            <div key={objective.id}>
              <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
                {objective.title}
              </h3>
              <ul className="mt-1 divide-y">
                {report.keyResults
                  .filter((k) => k.objectiveId === objective.id)
                  .sort((a, b) => b.rating - a.rating)
                  .map((keyResult) => (
                    <li key={keyResult.id} className="py-2.5 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 font-medium">
                          {keyResultText.get(keyResult.id)}
                        </p>
                        <span className="flex shrink-0 items-center gap-2">
                          {keyResult.picked && (
                            <Badge variant="outline">
                              {copy.results.chosen}
                            </Badge>
                          )}
                          <span
                            className={cn(
                              "font-pixel text-xs uppercase",
                              RATING_STYLE[keyResult.rating],
                            )}
                          >
                            {copy.results.ratings[keyResult.rating]}
                          </span>
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {keyResultWhy.get(keyResult.id)}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="results-initiatives" className="pixel-card p-4">
        <h2 id="results-initiatives" className="font-heading font-semibold">
          {copy.results.initiatives}
        </h2>
        <ul className="mt-2 divide-y">
          {[...report.initiatives]
            .sort((a, b) => b.value - a.value)
            .map((item) => {
              const details = initiative.get(item.id);
              const shipped = item.status === "ok";
              return (
                <li key={item.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{details?.title}</p>
                    <span className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {copy.results.valueLabel(item.value)}
                      </Badge>
                      <span
                        className={cn(
                          "font-pixel text-xs uppercase",
                          shipped
                            ? "text-success"
                            : item.status === "unscheduled"
                              ? "text-muted-foreground"
                              : "text-destructive",
                        )}
                      >
                        {copy.board.statusShort[item.status]}
                      </span>
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {copy.results.serves}:{" "}
                    <span className="text-foreground">
                      {item.objectiveId
                        ? objectiveTitle.get(item.objectiveId)
                        : copy.results.noObjective}
                    </span>{" "}
                    ·{" "}
                    {item.optimalStart === null
                      ? copy.results.notInBest
                      : copy.results.inBest(item.optimalStart)}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {initiativeWhy.get(item.id)}
                  </p>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="pixel-card p-4">
        <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
          {copy.results.principle}
        </h2>
        <p className="mt-2 leading-relaxed">{hidden.principle}</p>
      </section>
    </div>
  );
}
