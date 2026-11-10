"use client";

/**
 * After a case: a fresh case of the same kind when the score shows the
 * lesson has not landed yet, a replay, and the case for the weakest skill.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { ModuleSprite } from "@/components/arcade/icons";
import type { CaseSummary } from "@/components/case-library";
import { Button } from "@/components/ui/button";
import type { BaseCase } from "@/core/case-engine";
import type { Attempt } from "@/core/storage";
import { getMessages } from "@/i18n";
import { freshCaseId, randomSeed } from "@/lib/practice";
import { recommendFromAttempts } from "@/lib/recommend";

/** Below two stars the fresh case comes first. */
const PRACTICE_BELOW = 75;

export function NextSteps({
  revealedCase,
  score,
  attempts,
  catalog,
  generatingModuleIds,
}: {
  revealedCase: BaseCase;
  score: number;
  attempts: readonly Attempt[];
  catalog: readonly CaseSummary[];
  generatingModuleIds: readonly string[];
}) {
  const messages = getMessages();
  const copy = messages.learn.nextSteps;
  // Picked once per visit: a click always opens a case nobody has played.
  const [seed] = useState(randomSeed);
  const canGenerate = generatingModuleIds.includes(revealedCase.moduleId);
  const fresh = canGenerate
    ? `/case/${freshCaseId(
        {
          caseId: revealedCase.id,
          moduleId: revealedCase.moduleId,
          difficulty: revealedCase.difficulty,
          industry: revealedCase.company.industry,
        },
        seed,
      )}`
    : null;

  const recommendation = useMemo(() => {
    const [first] = recommendFromAttempts(attempts, catalog, 1);
    const summary = first && catalog.find((c) => c.id === first.caseId);
    return summary && first ? { ...first, summary } : null;
  }, [attempts, catalog]);

  const items = [
    fresh !== null && {
      key: "fresh",
      moduleId: revealedCase.moduleId,
      title: copy.freshTitle,
      body: copy.freshBody,
      href: fresh,
      cta: copy.freshCta,
    },
    {
      key: "replay",
      moduleId: revealedCase.moduleId,
      title: copy.replayTitle,
      body: copy.replayBody,
      href: `/case/${revealedCase.id}`,
      cta: copy.replayCta,
    },
    recommendation !== null && {
      key: "recommend",
      moduleId: recommendation.summary.moduleId,
      title: copy.recommendTitle,
      body: `${messages.skillsPage.reasons[recommendation.reason](
        messages.skills[recommendation.skill],
      )} ${recommendation.summary.title} · ${recommendation.summary.moduleName}.`,
      href: `/case/${recommendation.caseId}`,
      cta: copy.recommendCta,
    },
  ].filter((item) => item !== false);

  // A great score does not need a fresh case of the same thing.
  const shown =
    score >= PRACTICE_BELOW ? items.filter((i) => i.key !== "fresh") : items;

  return (
    <section aria-labelledby="next-steps-title" className="pixel-card p-5">
      <h2 id="next-steps-title" className="font-pixel text-lg">
        {copy.title}
      </h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {shown.map((item, index) => (
          <li
            key={item.key}
            className="bg-muted/40 flex flex-col gap-2 rounded-md border-2 p-4"
          >
            <div className="flex items-center gap-2">
              <ModuleSprite moduleId={item.moduleId} size={20} />
              <h3 className="font-pixel text-sm">{item.title}</h3>
            </div>
            <p className="text-muted-foreground flex-1 text-sm">{item.body}</p>
            <Button
              asChild
              size="sm"
              variant={index === 0 ? "default" : "outline"}
              className="self-start"
            >
              <Link href={item.href}>{item.cta}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
