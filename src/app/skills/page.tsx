import type { Metadata } from "next";

import { SkillsDashboard } from "@/components/skills-dashboard";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const cases = await listCaseSummaries();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">
      <SkillsDashboard cases={cases} />
    </div>
  );
}
