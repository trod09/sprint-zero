import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
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
        <Panel icon="flag" title={copy.brief.label}>
          <p className="leading-relaxed text-pretty">{publicCase.brief}</p>
        </Panel>
      </section>
      <QuickWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
