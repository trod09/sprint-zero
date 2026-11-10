import type { Metadata } from "next";

import { SkillsDashboard } from "@/components/skills-dashboard";
import { getMessages } from "@/i18n";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const copy = getMessages().skillsPage;
  const cases = await listCaseSummaries();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {copy.title}
      </h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">{copy.subtitle}</p>
      <div className="mt-8">
        <SkillsDashboard cases={cases} />
      </div>
    </div>
  );
}
