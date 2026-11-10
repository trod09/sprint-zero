import type { Metadata } from "next";

import { PageHeader } from "@/components/arcade/page-header";
import { CaseLibrary } from "@/components/case-library";
import { getMessages } from "@/i18n";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Case library" };

export default async function LibraryPage() {
  const copy = getMessages().library;
  const cases = await listCaseSummaries();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-10 pb-20 sm:px-6">
      <PageHeader icon="star" title={copy.title} subtitle={copy.subtitle} />
      <div className="mt-8">
        <CaseLibrary cases={cases} />
      </div>
    </div>
  );
}
