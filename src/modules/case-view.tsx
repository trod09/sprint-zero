/**
 * Renders a case with the right module's interface. Server component.
 *
 * Adding a playable module means adding its case view here.
 */
import type { PublicBaseCase } from "@/core/case-engine";

import { BacklogCaseView } from "./backlog/components/backlog-case-view";
import type { SubmitAttempt } from "./backlog/components/backlog-workspace";
import { publicBacklogCaseSchema } from "./backlog/schema";

export function CaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicBaseCase;
  submit: SubmitAttempt;
}) {
  switch (publicCase.moduleId) {
    case "backlog":
      return (
        <BacklogCaseView
          publicCase={publicBacklogCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    default:
      return null;
  }
}
