"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import { OptionCard } from "@/components/option-card";
import { InlineResult, SubmitDialog } from "@/components/submit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";
import { cn } from "@/lib/utils";

import { evaluatePlan, nextFreeSprint } from "../planning";
import {
  MAX_KEY_RESULTS_PER_OBJECTIVE,
  MAX_TEXT,
  placementSchema,
  SPRINTS,
  type Placement,
  type PublicRoadmapCase,
  type RoadmapAnswer,
} from "../schema";
import { Timeline } from "./timeline";

const TABS = ["keyResults", "roadmap", "review"] as const;
type Tab = (typeof TABS)[number];

const draftKey = (caseId: string) =>
  `sprint-zero:roadmap-okrs-draft:v1:${caseId}`;

const text = z.string().max(MAX_TEXT).catch("");
const draftSchema = z.object({
  tab: z.enum(TABS).catch("keyResults"),
  keyResultIds: z.array(z.string()).max(24).catch([]),
  schedule: z.array(placementSchema).max(12).catch([]),
  rationale: text,
  tradeoffs: text,
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  tab: "keyResults",
  keyResultIds: [],
  schedule: [],
  rationale: "",
  tradeoffs: "",
});

/** Drops ids that are not part of this case, e.g. from an older draft. */
function sanitize(draft: Draft, publicCase: PublicRoadmapCase): Draft {
  const seen = new Set<string>();
  return {
    ...draft,
    keyResultIds: draft.keyResultIds.filter((id) =>
      publicCase.keyResults.some((k) => k.id === id),
    ),
    schedule: draft.schedule.filter((placement) => {
      const known = publicCase.initiatives.some(
        (i) => i.id === placement.initiativeId,
      );
      if (!known || seen.has(placement.initiativeId)) return false;
      seen.add(placement.initiativeId);
      return true;
    }),
  };
}

export function RoadmapWorkspace(props: {
  publicCase: PublicRoadmapCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(
    () =>
      isClient
        ? sanitize(
            loadDraft(draftKey(props.publicCase.id), draftSchema, emptyDraft),
            props.publicCase,
          )
        : emptyDraft(),
    [isClient, props.publicCase],
  );
  return (
    <Workspace
      key={isClient ? "client" : "server"}
      {...props}
      initialDraft={initial}
      persist={isClient}
    />
  );
}

const STATUS_TEXT = {
  ok: "text-success",
  blocked: "text-warning",
  overlap: "text-destructive",
  overflow: "text-destructive",
} as const;

function Workspace({
  publicCase,
  submit,
  initialDraft,
  persist,
}: {
  publicCase: PublicRoadmapCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().roadmap;
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.submit.failed,
      onSubmitted: () => clearDraft(draftKey(publicCase.id)),
    });

  useEffect(() => {
    if (persist) saveDraft(draftKey(publicCase.id), draft);
  }, [persist, publicCase.id, draft]);

  const update = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  /** Moves to a step from the buttons below it, back up to the tabs. */
  const goTo = (tab: Tab) => {
    update({ tab });
    document
      .getElementById("roadmap-steps")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const { initiatives, teams, objectives, keyResults } = publicCase;
  const plan = useMemo(
    () => evaluatePlan(initiatives, draft.schedule),
    [initiatives, draft.schedule],
  );
  const itemOf = new Map(plan.items.map((item) => [item.initiativeId, item]));
  const titleOf = new Map(initiatives.map((i) => [i.id, i.title]));

  const pickedFor = (objectiveId: string) =>
    keyResults.filter(
      (k) => k.objectiveId === objectiveId && draft.keyResultIds.includes(k.id),
    );
  const maxKeyResults = objectives.length * MAX_KEY_RESULTS_PER_OBJECTIVE;
  const problems = plan.items.filter((item) => item.status !== "ok").length;
  const canSubmit = draft.keyResultIds.length > 0 && draft.schedule.length > 0;

  useMission(
    inlineResult
      ? null
      : {
          objectives: [
            {
              id: "key-results",
              label: copy.mission.keyResults,
              done: objectives.every(
                (objective) =>
                  pickedFor(objective.id).length >=
                  MAX_KEY_RESULTS_PER_OBJECTIVE,
              ),
            },
            {
              id: "roadmap",
              label: copy.mission.roadmap,
              done: plan.deliveredIds.length > 0,
            },
            {
              id: "conflicts",
              label: copy.mission.conflicts,
              done: draft.schedule.length > 0 && problems === 0,
            },
            {
              id: "rationale",
              label: copy.mission.rationale,
              done: draft.rationale.trim() !== "",
            },
          ],
          action: {
            label: copy.submit.button,
            disabled: !canSubmit,
            hint: copy.submit.needsPlan,
            onClick: () => {
              clearError();
              setConfirming(true);
            },
          },
        },
  );

  if (inlineResult) return <InlineResult result={inlineResult} />;
  const toggleKeyResult = (id: string) =>
    update({
      keyResultIds: draft.keyResultIds.includes(id)
        ? draft.keyResultIds.filter((other) => other !== id)
        : [...draft.keyResultIds, id],
    });

  const place = (initiativeId: string, startSprint: number | null) => {
    const others = draft.schedule.filter(
      (p) => p.initiativeId !== initiativeId,
    );
    const next: Placement[] =
      startSprint === null
        ? others
        : [...others, { initiativeId, startSprint }];
    update({ schedule: next });
    setSelectedId(initiativeId);
  };

  const selectFromTimeline = (initiativeId: string) => {
    setSelectedId(initiativeId);
    document
      .getElementById(`initiative-${initiativeId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const answer = (): RoadmapAnswer => ({
    keyResultIds: draft.keyResultIds,
    schedule: draft.schedule,
    rationale: draft.rationale.trim(),
    tradeoffs: draft.tradeoffs.trim(),
  });

  return (
    <>
      <Tabs
        value={draft.tab}
        onValueChange={(tab) => update({ tab: tab as Tab })}
        id="roadmap-steps"
        className="scroll-mt-20 gap-5"
      >
        <TabsList aria-label={copy.tabs.label}>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {copy.tabs[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="keyResults" className="space-y-5">
          <p className="text-muted-foreground max-w-prose text-sm">
            {copy.keyResults.intro(MAX_KEY_RESULTS_PER_OBJECTIVE)}
          </p>
          {objectives.map((objective, index) => {
            const picked = pickedFor(objective.id);
            const full = picked.length >= MAX_KEY_RESULTS_PER_OBJECTIVE;
            return (
              <Panel
                key={objective.id}
                icon="flag"
                title={`O${index + 1} · ${objective.title}`}
                aside={
                  <Badge variant={full ? "default" : "outline"}>
                    {copy.keyResults.picked(
                      picked.length,
                      MAX_KEY_RESULTS_PER_OBJECTIVE,
                    )}
                  </Badge>
                }
              >
                <fieldset>
                  <legend className="text-muted-foreground text-sm">
                    {objective.description}
                  </legend>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {keyResults
                      .filter((k) => k.objectiveId === objective.id)
                      .map((keyResult) => (
                        <OptionCard
                          key={keyResult.id}
                          type="checkbox"
                          name={`key-results-${objective.id}`}
                          checked={draft.keyResultIds.includes(keyResult.id)}
                          disabled={full}
                          onChange={() => toggleKeyResult(keyResult.id)}
                          title={keyResult.text}
                        />
                      ))}
                  </div>
                </fieldset>
              </Panel>
            );
          })}
          <div className="flex justify-end">
            <Button type="button" onClick={() => goTo("roadmap")}>
              {copy.tabs.roadmap}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-5">
          <Panel
            id="timeline-title"
            icon="clock"
            title={copy.board.title}
            subtitle={copy.board.intro}
          >
            <Timeline
              teams={teams}
              initiatives={initiatives}
              items={plan.items}
              selectedId={selectedId}
              onSelect={selectFromTimeline}
              labelledBy="timeline-title"
            />
          </Panel>

          <h2 className="sr-only">{copy.board.initiatives}</h2>
          {teams.map((team) => (
            <Panel
              key={team.id}
              icon="people"
              headingLevel="h3"
              title={team.name}
              aside={copy.board.capacity(
                plan.sprintsUsed[team.id] ?? 0,
                SPRINTS,
              )}
            >
              <ul className="grid gap-3 lg:grid-cols-2">
                {initiatives
                  .filter((i) => i.teamId === team.id)
                  .map((initiative) => {
                    const item = itemOf.get(initiative.id);
                    const selectId = `start-${initiative.id}`;
                    const statusText = !item
                      ? copy.board.status.unscheduled
                      : item.status === "blocked"
                        ? copy.board.status.blocked(
                            item.blockedBy
                              .map((id) => titleOf.get(id) ?? id)
                              .join(", "),
                          )
                        : copy.board.status[item.status];
                    return (
                      <li
                        key={initiative.id}
                        id={`initiative-${initiative.id}`}
                        className={cn(
                          "bg-background/60 border-border scroll-mt-24 rounded-md border-2 p-3 transition-colors",
                          selectedId === initiative.id && "border-primary",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">
                            {initiative.title}
                          </p>
                          <span className="font-pixel text-ink shrink-0 text-xs">
                            {copy.board.effort(initiative.effort)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {initiative.description}
                        </p>
                        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span>
                            {copy.board.requester(initiative.requester)}
                          </span>
                          {initiative.dependsOn.length > 0 && (
                            <span className="text-foreground">
                              {copy.board.needs}:{" "}
                              {initiative.dependsOn
                                .map((id) => titleOf.get(id) ?? id)
                                .join(", ")}
                            </span>
                          )}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Label htmlFor={selectId} className="text-xs">
                            {copy.board.start}
                            <span className="sr-only"> {initiative.title}</span>
                          </Label>
                          <NativeSelect
                            size="sm"
                            id={selectId}
                            value={item ? String(item.startSprint) : ""}
                            onChange={(event) =>
                              place(
                                initiative.id,
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                          >
                            <option value="">{copy.board.notScheduled}</option>
                            {Array.from({ length: SPRINTS }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {copy.board.sprint(i + 1)}
                              </option>
                            ))}
                          </NativeSelect>
                          {!item && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                place(
                                  initiative.id,
                                  nextFreeSprint(
                                    initiatives,
                                    draft.schedule,
                                    initiative.id,
                                  ),
                                )
                              }
                            >
                              {copy.board.placeNext}
                            </Button>
                          )}
                        </div>
                        <p
                          aria-live="polite"
                          className={cn(
                            "mt-2 text-xs",
                            item
                              ? STATUS_TEXT[item.status]
                              : "text-muted-foreground",
                          )}
                        >
                          {statusText}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            </Panel>
          ))}
          <div className="flex justify-end">
            <Button type="button" onClick={() => goTo("review")}>
              {copy.tabs.review}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-5">
          <Panel icon="check" title={copy.review.title}>
            <ul className="space-y-1 text-sm">
              <li>
                {copy.review.keyResults(
                  objectives.reduce(
                    (total, objective) =>
                      total +
                      Math.min(
                        pickedFor(objective.id).length,
                        MAX_KEY_RESULTS_PER_OBJECTIVE,
                      ),
                    0,
                  ),
                  maxKeyResults,
                )}
              </li>
              <li>{copy.review.shipping(plan.deliveredIds.length)}</li>
              {problems > 0 && (
                <li className="text-destructive">
                  {copy.review.problems(problems)}
                </li>
              )}
              <li className="text-muted-foreground">
                {copy.review.leftOut(
                  initiatives.length - draft.schedule.length,
                )}
              </li>
            </ul>
            <div className="mt-4">
              <Timeline
                teams={teams}
                initiatives={initiatives}
                items={plan.items}
              />
            </div>
          </Panel>

          <Panel
            icon="pencil"
            title={copy.review.notes}
            bodyClassName="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="roadmap-rationale">{copy.review.rationale}</Label>
              <Textarea
                id="roadmap-rationale"
                rows={4}
                maxLength={MAX_TEXT}
                value={draft.rationale}
                placeholder={copy.review.rationalePlaceholder}
                onChange={(event) => update({ rationale: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roadmap-tradeoffs">{copy.review.tradeoffs}</Label>
              <Textarea
                id="roadmap-tradeoffs"
                rows={4}
                maxLength={MAX_TEXT}
                value={draft.tradeoffs}
                placeholder={copy.review.tradeoffsPlaceholder}
                onChange={(event) => update({ tradeoffs: event.target.value })}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {copy.review.coachNote}
            </p>
          </Panel>
        </TabsContent>
      </Tabs>

      <SubmitDialog
        copy={copy.submit}
        open={confirming}
        onOpenChange={setConfirming}
        error={error}
        isSubmitting={isSubmitting}
        onConfirm={() => submitAnswer(answer())}
      />
    </>
  );
}
