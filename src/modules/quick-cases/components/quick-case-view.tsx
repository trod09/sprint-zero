import { CaseHeader } from "@/components/arcade/case-header";
import { getMessages } from "@/i18n";
import type { SubmitAttempt } from "@/lib/use-submit-attempt";

import type { PublicQuickCase } from "../schema";
import { QuickWorkspace } from "./quick-workspace";

/** A full quick case: the situation, then the exhibits beside the decisions. */
export function QuickCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicQuickCase;
  submit: SubmitAttempt;
}) {
  const copy = getMessages().quick;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} tag={copy.kinds[publicCase.kind]} />
        <div className="pixel-card p-4">
          <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
            {copy.brief.label}
          </h2>
          <p className="mt-2 leading-relaxed text-pretty">{publicCase.brief}</p>
        </div>
      </section>
      <QuickWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
