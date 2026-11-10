import { CaseHeader } from "@/components/arcade/case-header";
import { getMessages } from "@/i18n";
import type { SubmitAttempt } from "@/lib/use-submit-attempt";

import type { PublicProductCase } from "../schema";
import { EstimationWorkspace } from "./estimation-workspace";
import { StructuredWorkspace } from "./structured-workspace";

/** A full Product Case: the interviewer's question and context, then the answer. */
export function ProductCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicProductCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.productCase;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} tag={copy.kinds[publicCase.kind]} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <figure className="bg-card rounded-xl border p-4">
            <figcaption className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.brief.question}
            </figcaption>
            <blockquote className="font-heading mt-2 text-lg leading-snug text-pretty">
              {publicCase.prompt}
            </blockquote>
          </figure>
          <div className="bg-card rounded-xl border p-4">
            <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.brief.context}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty">
              {publicCase.brief}
            </p>
          </div>
        </div>
      </section>
      {publicCase.kind === "estimation" ? (
        <EstimationWorkspace publicCase={publicCase} submit={submit} />
      ) : (
        <StructuredWorkspace publicCase={publicCase} submit={submit} />
      )}
    </div>
  );
}
