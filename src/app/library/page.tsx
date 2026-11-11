import type { Metadata } from "next";

import { CaseLibrary } from "@/components/case-library";
import { LibraryHero } from "@/components/library-hero";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Case library" };

export default async function LibraryPage() {
  const cases = await listCaseSummaries();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-20 sm:px-6">
      <LibraryHero cases={cases} />
      <CaseLibrary cases={cases} />
    </div>
  );
}
