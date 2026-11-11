import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";

import type { PublicUxCritiqueCase } from "../schema";
import { CritiqueWorkspace, type SubmitAttempt } from "./critique-workspace";

/** A full UX Critique case: the ask and the user's goal, then the screen. */
export function UxCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicUxCritiqueCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.ux.brief;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <Panel icon="flag" title={copy.label}>
            <p className="leading-relaxed text-pretty">{publicCase.brief}</p>
          </Panel>
          <Panel icon="target" title={copy.goal}>
            <p className="text-sm leading-relaxed text-pretty">
              {publicCase.userGoal}
            </p>
          </Panel>
        </div>
      </section>
      <CritiqueWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
