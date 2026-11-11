"use client";

/**
 * A world's cases as levels: one zone per difficulty, a tile per case with
 * its number, its stars and the best score in this browser.
 */
import { Panel } from "@/components/arcade/panel";
import type { CaseSummary } from "@/components/case-library";
import { DIFFICULTIES } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { bestScores, useAttempts } from "@/lib/use-attempts";

import { CaseTile } from "./case-tile";

const ZONE_ICONS = ["play", "level", "trophy"] as const;

export function WorldLevels({ cases }: { cases: readonly CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.module.levels;
  const { attempts } = useAttempts();
  const best = attempts ? bestScores(attempts) : new Map<string, number>();

  const zones = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    cases: cases.filter((c) => c.difficulty === difficulty),
  })).filter((zone) => zone.cases.length > 0);
  // Levels are numbered across zones, in the order they are shown.
  const numberOf = new Map(
    zones.flatMap((zone) => zone.cases).map((c, index) => [c.id, index + 1]),
  );

  return (
    <div className="space-y-6">
      {zones.map((zone, index) => {
        const cleared = zone.cases.filter((c) => best.has(c.id)).length;
        return (
          <Panel
            key={zone.difficulty}
            icon={ZONE_ICONS[DIFFICULTIES.indexOf(zone.difficulty)]}
            title={copy.zone(index + 1, messages.difficulty[zone.difficulty])}
            aside={copy.cleared(cleared, zone.cases.length)}
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {zone.cases.map((summary) => (
                <li key={summary.id}>
                  <CaseTile
                    summary={summary}
                    score={best.get(summary.id)}
                    number={numberOf.get(summary.id)}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}
    </div>
  );
}
