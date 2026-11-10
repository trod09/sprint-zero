import { CaseHeader } from "@/components/arcade/case-header";
import { getMessages } from "@/i18n";
import type { SubmitAttempt } from "@/lib/use-submit-attempt";

import { SPRINTS, type PublicRoadmapCase } from "../schema";
import { RoadmapWorkspace } from "./roadmap-workspace";

/** A full Roadmap & OKRs case: the ask and the objectives, then the planner. */
export function RoadmapCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicRoadmapCase;
  submit: SubmitAttempt;
}) {
  const copy = getMessages().roadmap.brief;
  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div className="pixel-card p-4">
            <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.label}
            </h2>
            <p className="mt-2 leading-relaxed text-pretty">
              {publicCase.brief}
            </p>
            <h3 className="font-pixel text-ink mt-5 text-xs tracking-wide uppercase">
              {copy.objectives}
            </h3>
            <ol className="mt-2 space-y-2">
              {publicCase.objectives.map((objective, index) => (
                <li key={objective.id} className="flex gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="font-pixel text-ink w-5 shrink-0"
                  >
                    O{index + 1}
                  </span>
                  <span>
                    <span className="font-semibold">{objective.title}.</span>{" "}
                    <span className="text-muted-foreground">
                      {objective.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="pixel-card p-4">
            <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.teams}
            </h2>
            <ul className="mt-2 space-y-3 text-sm">
              {publicCase.teams.map((team) => (
                <li key={team.id}>
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-muted-foreground">{team.focus}</p>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
              {copy.teamCapacity(SPRINTS)}
            </p>
          </div>
        </div>
      </section>
      <RoadmapWorkspace publicCase={publicCase} submit={submit} />
    </div>
  );
}
