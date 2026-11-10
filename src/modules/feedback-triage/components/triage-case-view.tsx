import { Badge } from "@/components/ui/badge";
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
  const { company } = publicCase;
  const counts = SOURCES.map((source) => ({
    source,
    count: publicCase.items.filter((item) => item.source === source).length,
  }));

  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground font-medium">{company.name}</span>
            <span aria-hidden="true">·</span>
            <span>{company.industry}</span>
            <span aria-hidden="true">·</span>
            <span>{company.stage}</span>
            <Badge variant="outline" className="ml-1">
              {messages.difficulty[publicCase.difficulty]}
            </Badge>
          </div>
          <h1
            id="case-title"
            className="font-heading mt-2 text-2xl font-semibold tracking-tight text-balance"
          >
            {publicCase.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {company.description}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {copy.brief.label}
          </h2>
          <p className="mt-2 leading-relaxed text-pretty">{publicCase.brief}</p>
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
        </div>
      </section>
      <TriageWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
