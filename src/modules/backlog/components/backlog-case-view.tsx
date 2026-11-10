import type { PublicBacklogCase } from "../schema";
import { BacklogWorkspace, type SubmitAttempt } from "./backlog-workspace";
import { CaseBrief } from "./case-brief";

/** A full Backlog Simulator case: the brief, then the planner. */
export function BacklogCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicBacklogCase;
  submit: SubmitAttempt;
}) {
  return (
    <div className="space-y-8">
      <CaseBrief publicCase={publicCase} />
      <BacklogWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
