"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DIFFICULTIES,
  generatedCaseId,
  INDUSTRY_KEYS,
  type Difficulty,
  type IndustryKey,
} from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { randomSeed } from "@/lib/practice";

const selectClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30";

/** Builds a new case from an industry, a difficulty and a fresh seed. */
export function GenerateCaseCard({ moduleId }: { moduleId: string }) {
  const messages = getMessages();
  const copy = messages.generate;
  const router = useRouter();
  const [industry, setIndustry] = useState<IndustryKey>("fintech");
  const [difficulty, setDifficulty] = useState<Difficulty>("pm");
  const [pending, setPending] = useState(false);

  return (
    <section aria-labelledby="generate-title" className="pixel-card mt-8 p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="text-brand mt-0.5 size-5" aria-hidden="true" />
        <div>
          <h2 id="generate-title" className="font-heading font-semibold">
            {copy.title}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">{copy.intro}</p>
        </div>
      </div>
      <form
        className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          router.push(
            `/case/${generatedCaseId(moduleId, { seed: randomSeed(), difficulty, industry })}`,
          );
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="generate-industry">{copy.industry}</Label>
          <select
            id="generate-industry"
            className={selectClassName}
            value={industry}
            onChange={(event) => setIndustry(event.target.value as IndustryKey)}
          >
            {INDUSTRY_KEYS.map((key) => (
              <option key={key} value={key}>
                {copy.industries[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="generate-difficulty">{copy.difficulty}</Label>
          <select
            id="generate-difficulty"
            className={selectClassName}
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as Difficulty)
            }
          >
            {DIFFICULTIES.map((key) => (
              <option key={key} value={key}>
                {messages.difficulty[key]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? copy.generating : copy.button}
        </Button>
      </form>
      <p className="text-muted-foreground mt-3 text-xs">{copy.note}</p>
    </section>
  );
}
