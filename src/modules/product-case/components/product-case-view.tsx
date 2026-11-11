import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
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
        <CaseHeader
          publicCase={publicCase}
          tag={copy.kinds[publicCase.kind]}
          tipKey={
            publicCase.kind === "estimation"
              ? "product-case-estimation"
              : undefined
          }
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel icon="flag" title={copy.brief.question}>
            <blockquote className="font-heading mt-2 text-lg leading-snug text-pretty">
              {publicCase.prompt}
            </blockquote>
          </Panel>
          <Panel icon="doc" title={copy.brief.context}>
            <p className="text-sm leading-relaxed text-pretty">
              {publicCase.brief}
            </p>
          </Panel>
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
