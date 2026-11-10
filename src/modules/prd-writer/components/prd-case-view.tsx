import { CaseHeader } from "@/components/arcade/case-header";
import { getMessages } from "@/i18n";
import type { SubmitAttempt } from "@/lib/use-submit-attempt";

import type { PublicPrdCase } from "../schema";
import { PrdWorkspace } from "./prd-workspace";

/** A full PRD Writer case: the ask, then the editor beside the documents. */
export function PrdCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicPrdCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.prd.brief;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />
        <div className="bg-card rounded-xl border p-4">
          <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
            {copy.label}
          </h2>
          <p className="mt-2 leading-relaxed text-pretty">{publicCase.brief}</p>
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">{copy.feature}: </span>
            <span className="font-medium">{publicCase.feature}</span>
          </p>
        </div>
      </section>
      <PrdWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
