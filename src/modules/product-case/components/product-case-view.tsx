import { Badge } from "@/components/ui/badge";
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
  const { company } = publicCase;
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
            <Badge variant="secondary">{copy.kinds[publicCase.kind]}</Badge>
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <figure className="bg-card rounded-xl border p-4">
            <figcaption className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {copy.brief.question}
            </figcaption>
            <blockquote className="font-heading mt-2 text-lg leading-snug text-pretty">
              {publicCase.prompt}
            </blockquote>
          </figure>
          <div className="bg-card rounded-xl border p-4">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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
