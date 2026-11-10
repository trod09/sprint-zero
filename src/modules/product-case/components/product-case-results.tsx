"use client";

import type { ReactNode } from "react";

import { RatingDots } from "@/components/rating-dots";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { formatClock } from "../draft";
import { describeRatio, formatAmount, formatFact } from "../format";
import type {
  EstimationCase,
  ProductCase,
  ProductCaseAnswer,
  StructuredCase,
} from "../schema";
import type {
  EstimationReport,
  ProductCaseReport,
  StructuredReport,
} from "../scoring";

export function ProductCaseResults({
  caseData,
  report,
  answer,
}: {
  caseData: ProductCase;
  report: ProductCaseReport;
  answer: ProductCaseAnswer | null;
}) {
  const copy = getMessages().productCase.results;
  const timing = answer?.timing;
  return (
    <div className="space-y-6">
      {timing?.timed && (
        <p className="text-muted-foreground text-sm">
          {copy.timing(
            formatClock(timing.secondsUsed),
            formatClock(caseData.timeLimitMinutes * 60),
          )}
        </p>
      )}
      {caseData.kind === "estimation" && report.kind === "estimation" ? (
        <EstimationResults caseData={caseData} report={report} />
      ) : caseData.kind !== "estimation" && report.kind === "structured" ? (
        <StructuredResults caseData={caseData} report={report} />
      ) : null}
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium">{copy.principle}:</span>{" "}
        {caseData.hidden.principle}
      </p>
    </div>
  );
}

function StepSection({
  id,
  title,
  ideal,
  children,
}: {
  id: string;
  title: string;
  ideal: string;
  children: ReactNode;
}) {
  const copy = getMessages().productCase.results;
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="bg-card space-y-4 rounded-xl border p-5"
    >
      <h2 id={`${id}-title`} className="font-heading font-semibold">
        {title}
      </h2>
      <div className="border-primary/40 bg-primary/5 rounded-md border-l-2 px-3 py-2">
        <p className="text-xs font-medium tracking-wide uppercase">
          {copy.ideal}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-pretty">{ideal}</p>
      </div>
      {children}
    </section>
  );
}

function OptionRow({
  title,
  why,
  badges,
  rating,
}: {
  title: string;
  why: string;
  badges: ReactNode;
  rating: ReactNode;
}) {
  return (
    <li className="space-y-1 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {badges}
        <span className="text-muted-foreground ml-auto flex items-center gap-3 text-xs">
          {rating}
        </span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{why}</p>
    </li>
  );
}

function StructuredResults({
  caseData,
  report,
}: {
  caseData: StructuredCase;
  report: StructuredReport;
}) {
  const messages = getMessages();
  const copy = messages.productCase;
  const { hidden } = caseData;
  const nameOf = new Map<string, string>([
    ...caseData.segments.map((s) => [s.id, s.name] as const),
    ...caseData.problems.map((p) => [p.id, p.statement] as const),
    ...caseData.solutions.map((s) => [s.id, s.name] as const),
    ...caseData.metrics.map((m) => [m.id, m.name] as const),
  ]);
  const effortOf = new Map(caseData.solutions.map((s) => [s.id, s.effort]));
  const problemWhy = new Map(hidden.problems.map((p) => [p.id, p.why]));
  const solutionWhy = new Map(hidden.solutions.map((s) => [s.id, s.why]));

  return (
    <>
      <StepSection
        id="users"
        title={copy.steps.users}
        ideal={hidden.ideal.users}
      >
        <ul className="divide-y">
          {[...hidden.segments]
            .sort((a, b) => b.fit - a.fit)
            .map((segment) => (
              <OptionRow
                key={segment.id}
                title={nameOf.get(segment.id) ?? segment.id}
                why={segment.why}
                badges={
                  <>
                    {segment.id === report.segment.bestId && (
                      <Badge>{copy.results.best}</Badge>
                    )}
                    {segment.id === report.segment.chosenId && (
                      <Badge variant="outline">{copy.results.yourChoice}</Badge>
                    )}
                  </>
                }
                rating={
                  <>
                    {copy.results.fit}{" "}
                    <RatingDots value={segment.fit} max={3} />
                  </>
                }
              />
            ))}
        </ul>
      </StepSection>

      <StepSection
        id="problems"
        title={copy.steps.problems}
        ideal={hidden.ideal.problems}
      >
        <p className="text-muted-foreground text-xs">
          {copy.results.judgedFor(nameOf.get(report.segment.basisId) ?? "")}
        </p>
        <ul className="divide-y">
          {[...report.problems]
            .sort((a, b) => b.severity - a.severity)
            .map((problem) => (
              <OptionRow
                key={problem.id}
                title={nameOf.get(problem.id) ?? problem.id}
                why={problemWhy.get(problem.id) ?? ""}
                badges={
                  <>
                    {problem.top && <Badge>{copy.results.best}</Badge>}
                    {problem.picked && (
                      <Badge variant="outline">{copy.results.picked}</Badge>
                    )}
                  </>
                }
                rating={
                  <>
                    {copy.results.severity}{" "}
                    <RatingDots value={problem.severity} max={3} />
                  </>
                }
              />
            ))}
        </ul>
      </StepSection>

      <StepSection
        id="solutions"
        title={copy.steps.solutions}
        ideal={hidden.ideal.solutions}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th scope="col" className="w-12 pb-2 font-medium">
                  {copy.results.rank}
                </th>
                <th scope="col" className="pb-2 font-medium">
                  <span className="sr-only">{copy.steps.solutions}</span>
                </th>
                <th scope="col" className="w-16 pb-2 font-medium">
                  {copy.solutions.effort}
                </th>
                <th scope="col" className="w-24 pb-2 text-right font-medium">
                  {copy.results.priority}
                </th>
                <th scope="col" className="w-20 pb-2 text-right font-medium">
                  {copy.results.yourOrder}
                </th>
              </tr>
            </thead>
            <tbody>
              {report.solutions.map((solution) => {
                const effort = effortOf.get(solution.id);
                return (
                  <tr
                    key={solution.id}
                    className={cn(
                      "border-t align-top",
                      solution.rank <= 3 && "bg-primary/5",
                    )}
                  >
                    <td className="py-2 font-mono text-xs tabular-nums">
                      {solution.rank}
                    </td>
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <span className="font-medium">
                        {nameOf.get(solution.id)}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                        {solutionWhy.get(solution.id)}
                      </span>
                    </th>
                    <td className="py-2 text-xs">
                      {effort ? copy.solutions.efforts[effort] : ""}
                    </td>
                    <td className="py-2 text-right font-mono text-xs tabular-nums">
                      {solution.priority.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono text-xs tabular-nums">
                      {solution.learnerPosition ?? copy.results.notRanked}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-xs">
          {copy.results.judgedForProblems(
            report.problemBasis.map((id) => nameOf.get(id) ?? id),
          )}
        </p>
      </StepSection>

      <StepSection
        id="metrics"
        title={copy.steps.metrics}
        ideal={hidden.ideal.metrics}
      >
        <ul className="divide-y">
          {[...hidden.metrics]
            .sort(
              (a, b) =>
                Math.max(b.success, b.guardrail) -
                  Math.max(a.success, a.guardrail) || b.success - a.success,
            )
            .map((metric) => (
              <OptionRow
                key={metric.id}
                title={nameOf.get(metric.id) ?? metric.id}
                why={metric.why}
                badges={
                  <>
                    {metric.id === report.metrics.successId && (
                      <Badge variant="outline">
                        {copy.results.yourChoice}: {copy.metrics.success}
                      </Badge>
                    )}
                    {metric.id === report.metrics.guardrailId && (
                      <Badge variant="outline">
                        {copy.results.yourChoice}: {copy.metrics.guardrail}
                      </Badge>
                    )}
                  </>
                }
                rating={
                  <>
                    <span className="flex items-center gap-1">
                      {copy.results.successFit}
                      <RatingDots value={metric.success} max={2} />
                    </span>
                    <span className="flex items-center gap-1">
                      {copy.results.guardrailFit}
                      <RatingDots value={metric.guardrail} max={2} />
                    </span>
                  </>
                }
              />
            ))}
        </ul>
      </StepSection>
    </>
  );
}

function EstimationResults({
  caseData,
  report,
}: {
  caseData: EstimationCase;
  report: EstimationReport;
}) {
  const copy = getMessages().productCase.results.estimate;
  const { hidden } = caseData;
  const factOf = new Map(caseData.facts.map((f) => [f.id, f]));
  return (
    <>
      <section
        aria-labelledby="estimate-title"
        className="bg-card space-y-4 rounded-xl border p-5"
      >
        <h2 id="estimate-title" className="font-heading font-semibold">
          {copy.title}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">{copy.yours}</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">
              {report.estimate === null
                ? copy.none
                : formatAmount(report.estimate)}
            </dd>
            {report.ratio !== null && (
              <dd className="text-muted-foreground text-xs">
                {copy.off(describeRatio(report.ratio))}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">{copy.answer}</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">
              {formatAmount(report.truth)}
            </dd>
            <dd className="text-muted-foreground text-xs">
              {caseData.answerUnit}
            </dd>
          </div>
        </dl>
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{copy.formula}</h3>
          <p className="font-mono text-xs leading-relaxed">{report.formula}</p>
          <p className="text-muted-foreground text-sm">
            {copy.trap(formatAmount(report.trapEstimate))}
          </p>
        </div>
        <div className="border-primary/40 bg-primary/5 rounded-md border-l-2 px-3 py-2">
          <p className="text-xs font-medium tracking-wide uppercase">
            {getMessages().productCase.results.ideal}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-pretty">
            {hidden.ideal}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="facts-explained"
        className="bg-card space-y-3 rounded-xl border p-5"
      >
        <h2 id="facts-explained" className="font-heading font-semibold">
          {copy.facts}
        </h2>
        <ul className="divide-y">
          {[...report.facts]
            .sort((a, b) => Number(b.required) - Number(a.required))
            .map((entry) => {
              const fact = factOf.get(entry.id);
              if (!fact) return null;
              return (
                <li key={entry.id} className="space-y-1 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{fact.label}</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatFact(fact)}
                    </span>
                    <Badge variant={entry.required ? "default" : "secondary"}>
                      {entry.required ? copy.needed : copy.notNeeded}
                    </Badge>
                    {entry.used && (
                      <Badge
                        variant="outline"
                        className={cn(
                          !entry.required &&
                            "border-red-500/40 text-red-800 dark:text-red-300",
                        )}
                      >
                        {copy.used}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {hidden.factNotes[entry.id]}
                  </p>
                </li>
              );
            })}
        </ul>
        {hidden.constants.length > 0 && (
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">
              {copy.constants}:
            </span>{" "}
            {hidden.constants
              .map((c) => `${formatAmount(c.value)} (${c.label})`)
              .join(", ")}
          </p>
        )}
      </section>
    </>
  );
}
