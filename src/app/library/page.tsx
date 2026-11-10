import type { Metadata } from "next";

import { CaseLibrary } from "@/components/case-library";
import { getMessages } from "@/i18n";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Case library" };

export default async function LibraryPage() {
  const copy = getMessages().library;
  const cases = await listCaseSummaries();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-10 pb-20 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {copy.title}
      </h1>
      <p className="text-muted-foreground mt-1">{copy.subtitle}</p>
      <div className="mt-8">
        <CaseLibrary cases={cases} />
      </div>
    </div>
  );
}
