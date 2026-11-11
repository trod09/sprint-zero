"use client";

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
import { NativeSelect } from "@/components/ui/native-select";
import { Panel } from "@/components/arcade/panel";

/** Builds a new case from an industry, a difficulty and a fresh seed. */
export function GenerateCaseCard({ moduleId }: { moduleId: string }) {
  const messages = getMessages();
  const copy = messages.generate;
  const router = useRouter();
  const [industry, setIndustry] = useState<IndustryKey>("fintech");
  const [difficulty, setDifficulty] = useState<Difficulty>("pm");
  const [pending, setPending] = useState(false);

  return (
    <Panel
      id="generate-title"
      icon="bulb"
      title={copy.title}
      subtitle={copy.intro}
    >
      <form
        className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
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
          <NativeSelect
            id="generate-industry"
            value={industry}
            onChange={(event) => setIndustry(event.target.value as IndustryKey)}
          >
            {INDUSTRY_KEYS.map((key) => (
              <option key={key} value={key}>
                {copy.industries[key]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label htmlFor="generate-difficulty">{copy.difficulty}</Label>
          <NativeSelect
            id="generate-difficulty"
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
          </NativeSelect>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? copy.generating : copy.button}
        </Button>
      </form>
      <p className="text-muted-foreground mt-3 text-xs">{copy.note}</p>
    </Panel>
  );
}
