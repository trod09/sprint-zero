import { Badge } from "@/components/ui/badge";
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
