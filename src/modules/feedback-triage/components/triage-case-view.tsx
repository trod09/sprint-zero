import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";

import { SOURCES, type PublicFeedbackTriageCase } from "../schema";
import { TriageWorkspace, type SubmitAttempt } from "./triage-workspace";

/** A full Feedback Triage case: the ask, then the inbox and the board. */
export function TriageCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicFeedbackTriageCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.triage;
  const counts = SOURCES.map((source) => ({
    source,
    count: publicCase.items.filter((item) => item.source === source).length,
  }));

  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />
        <Panel icon="flag" title={copy.brief.label}>
          <p className="leading-relaxed text-pretty">{publicCase.brief}</p>
          <p className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              {copy.brief.period(publicCase.period.from, publicCase.period.to)}
            </span>
            {counts.map(({ source, count }) => (
              <span key={source}>
                {copy.sources[source]}: {count}
              </span>
            ))}
          </p>
        </Panel>
      </section>
      <TriageWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
