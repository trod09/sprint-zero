import { CaseHeader } from "@/components/arcade/case-header";
import { getMessages } from "@/i18n";
import type { SubmitAttempt } from "@/lib/use-submit-attempt";

import { MAX_QUESTIONS, type PublicInterviewCase } from "../schema";
import { InterviewWorkspace } from "./interview-workspace";

/** A full interview case: the ask and the person, then the call. */
export function InterviewCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicInterviewCase;
  submit: SubmitAttempt;
}) {
  const copy = getMessages().interview.brief;
  const { persona } = publicCase;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="pixel-card p-4">
            <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.label}
            </h2>
            <p className="mt-2 leading-relaxed text-pretty">
              {publicCase.brief}
            </p>
            <h3 className="font-pixel text-ink mt-4 text-xs tracking-wide uppercase">
              {copy.goal}
            </h3>
            <p className="mt-1 font-medium text-pretty">
              {publicCase.researchGoal}
            </p>
          </div>
          <div className="pixel-card p-4">
            <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.persona}
            </h2>
            <p className="mt-2 font-semibold">{persona.name}</p>
            <p className="text-sm">{persona.role}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {persona.context}
            </p>
            <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
              {copy.rules(MAX_QUESTIONS)}
            </p>
          </div>
        </div>
      </section>
      <InterviewWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
