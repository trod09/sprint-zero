"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";

import { PixelAvatar } from "@/components/arcade/icons";
import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import { AVATARS } from "@/components/arcade/sprites";
import { OptionCard } from "@/components/option-card";
import { InlineResult, SubmitDialog } from "@/components/submit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";
import { cn } from "@/lib/utils";

import { askInterviewee } from "../actions";
import { classifyQuestion } from "../analysis";
import {
  MAX_QUESTION_LENGTH,
  MAX_QUESTIONS,
  MAX_TEXT,
  MIN_QUESTIONS,
  type InterviewAnswer,
  type PublicInterviewCase,
} from "../schema";

const draftKey = (caseId: string) =>
  `sprint-zero:user-interview-draft:v1:${caseId}`;

const draftSchema = z.object({
  step: z.enum(["interview", "wrap"]).catch("interview"),
  /** Questions with the replies already received, in order. */
  turns: z
    .array(
      z.object({
        question: z.string().max(MAX_QUESTION_LENGTH),
        reply: z.string().max(2000),
      }),
    )
    .max(MAX_QUESTIONS)
    .catch([]),
  findingIds: z.array(z.string()).max(10).catch([]),
  summary: z.string().max(MAX_TEXT).catch(""),
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  step: "interview",
  turns: [],
  findingIds: [],
  summary: "",
});

export function InterviewWorkspace(props: {
  publicCase: PublicInterviewCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(() => {
    if (!isClient) return emptyDraft();
    const draft = loadDraft(
      draftKey(props.publicCase.id),
      draftSchema,
      emptyDraft,
    );
    return {
      ...draft,
      findingIds: draft.findingIds.filter((id) =>
        props.publicCase.findings.some((f) => f.id === id),
      ),
    };
  }, [isClient, props.publicCase]);
  return (
    <Workspace
      key={isClient ? "client" : "server"}
      {...props}
      initialDraft={initial}
      persist={isClient}
    />
  );
}

function Workspace({
  publicCase,
  submit,
  initialDraft,
  persist,
}: {
  publicCase: PublicInterviewCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().interview;
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [isAsking, startAsking] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const turnCount = draft.turns.length;
  useEffect(() => {
    if (turnCount > 0 || pendingQuestion) {
      logEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [turnCount, pendingQuestion]);

  const update = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const { persona, findings } = publicCase;
  const firstName = persona.name.split(" ")[0];
  const left = MAX_QUESTIONS - turnCount;
  const wrapping = draft.step === "wrap";
  const avatar = AVATARS[publicCase.seed % AVATARS.length].id;

  useMission(
    inlineResult
      ? null
      : {
          objectives: [
            {
              id: "questions",
              label: copy.mission.questions(MIN_QUESTIONS),
              done: turnCount >= MIN_QUESTIONS,
            },
            {
              id: "story",
              label: copy.mission.story,
              done: draft.turns.some(
                (turn) => classifyQuestion(turn.question).pastBehavior,
              ),
            },
            { id: "wrap", label: copy.mission.wrap, done: wrapping },
            {
              id: "findings",
              label: copy.mission.findings,
              done: draft.findingIds.length > 0,
            },
          ],
          action: wrapping
            ? {
                label: copy.submit.button,
                onClick: () => {
                  clearError();
                  setConfirming(true);
                },
              }
            : {
                label: copy.chat.wrapUp,
                disabled: turnCount < MIN_QUESTIONS || isAsking,
                hint: copy.chat.minimum(MIN_QUESTIONS),
                onClick: () => update({ step: "wrap" }),
              },
        },
  );

  if (inlineResult) return <InlineResult result={inlineResult} />;

  const ask = () => {
    const question = input.trim();
    if (question.length < 2 || left <= 0 || isAsking) return;
    setAskError(null);
    setPendingQuestion(question);
    setInput("");
    startAsking(async () => {
      try {
        const outcome = await askInterviewee({
          caseId: publicCase.id,
          questions: [...draft.turns.map((turn) => turn.question), question],
        });
        if (!outcome.ok) throw new Error(outcome.error.code);
        setDraft((current) => ({
          ...current,
          turns: [...current.turns, { question, reply: outcome.reply }],
        }));
      } catch {
        setAskError(copy.chat.failed);
        setInput(question);
      } finally {
        setPendingQuestion(null);
        inputRef.current?.focus();
      }
    });
  };

  const answer = (): InterviewAnswer => ({
    questions: draft.turns.map((turn) => turn.question),
    findingIds: draft.findingIds,
    summary: draft.summary.trim(),
  });

  const bubble = "max-w-[85%] rounded-md border-2 px-3 py-2 text-sm";

  return (
    <div className="space-y-5">
      <Panel
        id="chat-title"
        icon="chat"
        title={copy.chat.title}
        bodyClassName="p-0"
        aside={
          <span
            className={cn(
              "font-pixel",
              left <= 2 ? "text-warning" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {copy.chat.left(left)}
          </span>
        }
      >
        <div
          role="log"
          aria-label={copy.chat.title}
          tabIndex={0}
          className="focus-visible:ring-ring/50 max-h-[28rem] min-h-40 space-y-3 overflow-y-auto p-4 focus-visible:ring-3 focus-visible:outline-none"
        >
          {turnCount === 0 && !pendingQuestion && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="border-frame bg-muted rounded-md border-2 p-2">
                <PixelAvatar id={avatar} size={64} />
              </div>
              <div>
                <p className="font-pixel">{persona.name}</p>
                <p className="text-muted-foreground text-sm">{persona.role}</p>
              </div>
              <p className="text-muted-foreground max-w-sm text-sm">
                {copy.chat.empty(firstName)}
              </p>
            </div>
          )}
          {draft.turns.map((turn, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-end">
                <p className={cn(bubble, "border-frame bg-primary/15")}>
                  <span className="sr-only">{copy.chat.you}: </span>
                  {turn.question}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <PixelAvatar id={avatar} size={32} />
                <p className={cn(bubble, "bg-card")}>
                  <span className="font-pixel text-ink block text-[0.6875rem]">
                    {firstName}
                  </span>
                  {turn.reply}
                </p>
              </div>
            </div>
          ))}
          {pendingQuestion && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <p className={cn(bubble, "border-frame bg-primary/15")}>
                  {pendingQuestion}
                </p>
              </div>
              <p className="text-muted-foreground text-xs" role="status">
                {firstName} {copy.chat.thinking}
              </p>
            </div>
          )}
          <div ref={logEnd} />
        </div>

        {draft.step === "interview" && (
          <form
            className="space-y-2 border-t-2 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <Label htmlFor="interview-question" className="sr-only">
              {copy.chat.inputLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                id="interview-question"
                ref={inputRef}
                value={input}
                maxLength={MAX_QUESTION_LENGTH}
                disabled={left <= 0}
                autoComplete="off"
                placeholder={left > 0 ? copy.chat.placeholder : copy.chat.none}
                onChange={(event) => setInput(event.target.value)}
              />
              <Button
                type="submit"
                disabled={left <= 0 || isAsking || input.trim().length < 2}
              >
                {copy.chat.send}
              </Button>
            </div>
            {askError && (
              <p role="alert" className="text-destructive text-sm">
                {askError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={turnCount === 0 || isAsking}
                onClick={() => setDraft(emptyDraft())}
              >
                {copy.chat.restart}
              </Button>
              {turnCount < MIN_QUESTIONS && (
                <p className="text-muted-foreground text-xs">
                  {copy.chat.minimum(MIN_QUESTIONS)}
                </p>
              )}
            </div>
          </form>
        )}
      </Panel>

      {draft.step === "wrap" && (
        <>
          <Panel
            icon="bulb"
            title={copy.wrap.title}
            subtitle={copy.wrap.intro}
            bodyClassName="space-y-4"
          >
            <fieldset className="grid gap-2 md:grid-cols-2">
              <legend className="sr-only">{copy.wrap.title}</legend>
              {findings.map((finding) => (
                <OptionCard
                  key={finding.id}
                  type="checkbox"
                  name="interview-findings"
                  checked={draft.findingIds.includes(finding.id)}
                  onChange={() =>
                    update({
                      findingIds: draft.findingIds.includes(finding.id)
                        ? draft.findingIds.filter((id) => id !== finding.id)
                        : [...draft.findingIds, finding.id],
                    })
                  }
                  title={<span className="font-normal">{finding.text}</span>}
                />
              ))}
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="interview-summary">{copy.wrap.summary}</Label>
              <Textarea
                id="interview-summary"
                rows={4}
                maxLength={MAX_TEXT}
                value={draft.summary}
                placeholder={copy.wrap.summaryPlaceholder}
                onChange={(event) => update({ summary: event.target.value })}
              />
              <p className="text-muted-foreground text-xs">
                {copy.wrap.coachNote}
              </p>
            </div>
          </Panel>
          <Button
            type="button"
            variant="ghost"
            disabled={left <= 0}
            onClick={() => update({ step: "interview" })}
          >
            {copy.chat.back}
          </Button>
        </>
      )}

      <SubmitDialog
        copy={copy.submit}
        open={confirming}
        onOpenChange={setConfirming}
        error={error}
        isSubmitting={isSubmitting}
        onConfirm={() => submitAnswer(answer())}
      />
    </div>
  );
}
