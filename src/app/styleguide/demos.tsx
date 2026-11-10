"use client";

import { useState } from "react";

import { ResultScreen } from "@/components/arcade/result-screen";
import { StarRating } from "@/components/arcade/star-rating";
import { XPBar } from "@/components/arcade/xp-bar";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { levelFor } from "@/core/progress";
import { getMessages } from "@/i18n";

const DEMO_RESULT = {
  total: 92,
  criteria: [
    {
      id: "users",
      label: "Users",
      weight: 20,
      points: 20,
      ratio: 1,
      detail: "The segment where pain and value overlap most.",
    },
    {
      id: "problems",
      label: "Problems",
      weight: 25,
      points: 25,
      ratio: 1,
      detail: "You picked the problems that hurt most.",
    },
    {
      id: "priorities",
      label: "Priorities",
      weight: 30,
      points: 22,
      ratio: 0.73,
      detail: "Another option gives more relief per effort.",
    },
    {
      id: "metrics",
      label: "Metrics",
      weight: 25,
      points: 25,
      ratio: 1,
      detail: "Direct success metric and a real guardrail.",
    },
  ],
};

/** Animated pieces, with a button to play their animations again. */
export function AnimatedDemos() {
  const [run, setRun] = useState(0);
  return (
    <div className="space-y-6">
      <Button variant="secondary" onClick={() => setRun(run + 1)}>
        {getMessages().arcade.styleguide.replay}
      </Button>
      <div key={run} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <XPBar level={3} value={420} max={600} from={120} />
          <XPBar level={1} value={0} max={200} />
        </div>
        <div className="flex flex-wrap gap-6">
          {[0, 1, 2, 3].map((stars) => (
            <StarRating key={stars} stars={stars} animate />
          ))}
        </div>
        <ResultScreen
          moduleId="product-case"
          title="Improve Tunebox for podcast listeners"
          subtitle="Tunebox · Music streaming · PM"
          result={DEMO_RESULT}
          reward={{
            score: 92,
            stars: 3,
            xpGained: 167,
            before: { xp: 480, level: levelFor(480) },
            after: { xp: 647, level: levelFor(647) },
            newBadges: ["perfect"],
          }}
          nextHref="/styleguide"
          playAgainHref="/styleguide"
        />
      </div>
    </div>
  );
}

/** A mode switch, as used by dashboards and workspaces. */
export function SegmentedDemo() {
  const [view, setView] = useState<"scorecard" | "segments">("scorecard");
  return (
    <SegmentedControl
      label="View"
      value={view}
      onValueChange={setView}
      options={[
        { value: "scorecard", label: "Scorecard" },
        { value: "segments", label: "Segments" },
      ]}
    />
  );
}
