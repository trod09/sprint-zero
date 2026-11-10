import type { Metadata } from "next";
import { Suspense } from "react";

import { submitAttempt } from "@/app/actions/attempts";
import { requestFeedback } from "@/app/actions/feedback";
import { AttemptResults } from "@/components/attempt-results";
import { getMessages } from "@/i18n";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage({
  params,
}: PageProps<"/results/[attemptId]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6">
      <Suspense fallback={<ResultsFallback />}>
        <Results params={params} />
      </Suspense>
    </div>
  );
}

async function Results({
  params,
}: {
  params: PageProps<"/results/[attemptId]">["params"];
}) {
  const { attemptId } = await params;
  const catalog = await listCaseSummaries();
  return (
    <AttemptResults
      attemptId={attemptId}
      rescore={submitAttempt}
      requestFeedback={requestFeedback}
      catalog={catalog}
    />
  );
}

function ResultsFallback() {
  return (
    <p
      role="status"
      className="text-muted-foreground py-24 text-center text-sm"
    >
      {getMessages().results.loading}
    </p>
  );
}
