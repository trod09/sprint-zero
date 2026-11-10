"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";

import {
  findingSchema,
  ISSUE_TYPES,
  issueTypeSchema,
  MAX_FINDINGS,
  type Finding,
  type IssueType,
  type PublicUxCritiqueCase,
} from "../schema";
import { ScreenView } from "./screen-view";

export type { SubmitAttempt };

const selectClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30";

const draftSchema = z.object({
  findings: z.array(findingSchema).max(MAX_FINDINGS),
});

const draftKey = (caseId: string) =>
  `sprint-zero:ux-critique-draft:v1:${caseId}`;

function loadFindings(publicCase: PublicUxCritiqueCase): Finding[] {
  try {
    const raw = window.localStorage.getItem(draftKey(publicCase.id));
    if (!raw) return [];
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    const regionIds = new Set(publicCase.screen.regions.map((r) => r.id));
    return parsed.data.findings.filter((f) => regionIds.has(f.regionId));
  } catch {
    return [];
  }
}

function saveFindings(caseId: string, findings: Finding[]): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify({ findings }));
  } catch {
    // Storage full or disabled: the critique still works for this visit.
  }
}

function clearFindings(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}

type Mode = "use" | "mark";

export function CritiqueWorkspace(props: {
  publicCase: PublicUxCritiqueCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const findings = useMemo(
    () => (isClient ? loadFindings(props.publicCase) : []),
    [isClient, props.publicCase],
  );
  return (
    <Workspace
      key={isClient ? "client" : "server"}
      {...props}
      initialFindings={findings}
      persist={isClient}
    />
  );
}

function Workspace({
  publicCase,
  submit,
  initialFindings,
  persist,
}: {
  publicCase: PublicUxCritiqueCase;
  submit: SubmitAttempt;
  initialFindings: Finding[];
  persist: boolean;
}) {
  const messages = getMessages();
  const copy = messages.ux;
  const [mode, setMode] = useState<Mode>("use");
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [selected, setSelected] = useState<string | null>(null);
  const [type, setType] = useState<IssueType | "">("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.submit.failed,
      onSubmitted: () => clearFindings(publicCase.id),
    });

  useEffect(() => {
    if (persist) saveFindings(publicCase.id, findings);
  }, [persist, publicCase.id, findings]);

  const labelOf = new Map(
    publicCase.screen.regions.map((region) => [region.id, region.label]),
  );
  const markers = useMemo(() => {
    const counts = new Map<string, { count: number; tone: "neutral" }>();
    for (const finding of findings) {
      const current = counts.get(finding.regionId);
      counts.set(finding.regionId, {
        count: (current?.count ?? 0) + 1,
        tone: "neutral",
      });
    }
    return counts;
  }, [findings]);

  const addFinding = () => {
    if (!selected || !type || findings.length >= MAX_FINDINGS) return;
    setFindings([
      ...findings,
      { regionId: selected, type, note: note.trim().slice(0, 400) },
    ]);
    setSelected(null);
    setType("");
    setNote("");
  };

  if (inlineResult) {
    return (
      <section className="bg-card rounded-xl border p-6">
        <p className="font-heading text-5xl font-semibold tabular-nums">
          {inlineResult.total}
          <span className="text-muted-foreground text-lg"> / 100</span>
        </p>
        <div className="mt-6">
          <ScoreBreakdown criteria={inlineResult.criteria} />
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-3" aria-labelledby="screen-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="screen-title" className="font-heading font-semibold">
              {publicCase.screen.product.name}
            </h2>
            <p className="text-muted-foreground text-xs">
              {mode === "use" ? copy.modes.useHint : copy.modes.markHint}
            </p>
          </div>
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as Mode);
              if (value === "use") setSelected(null);
            }}
          >
            <TabsList aria-label={copy.modes.label}>
              <TabsTrigger value="use">{copy.modes.use}</TabsTrigger>
              <TabsTrigger value="mark">{copy.modes.mark}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScreenView
          screen={publicCase.screen}
          context={{
            mode,
            selected,
            onSelect: setSelected,
            markers,
          }}
        />
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <section
          aria-labelledby="finding-title"
          className="bg-card space-y-3 rounded-xl border p-4"
        >
          <h2 id="finding-title" className="font-heading font-semibold">
            {copy.finding.title}
          </h2>
          <div className="space-y-1">
            <p className="text-sm font-medium">{copy.finding.region}</p>
            <p
              aria-live="polite"
              className={selected ? "text-sm" : "text-muted-foreground text-xs"}
            >
              {selected ? labelOf.get(selected) : copy.finding.pickRegion}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="finding-type">{copy.finding.type}</Label>
            <select
              id="finding-type"
              className={selectClassName}
              value={type}
              disabled={!selected}
              onChange={(event) => {
                const parsed = issueTypeSchema.safeParse(event.target.value);
                setType(parsed.success ? parsed.data : "");
              }}
            >
              <option value="">{copy.finding.pickType}</option>
              {ISSUE_TYPES.map((issue) => (
                <option key={issue} value={issue}>
                  {copy.issues[issue].label}
                </option>
              ))}
            </select>
            {type && (
              <p className="text-muted-foreground text-xs">
                {copy.issues[type].hint}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="finding-note">{copy.finding.note}</Label>
            <Textarea
              id="finding-note"
              rows={2}
              maxLength={400}
              disabled={!selected}
              placeholder={copy.finding.notePlaceholder}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              disabled={!selected || !type || findings.length >= MAX_FINDINGS}
              onClick={addFinding}
            >
              {copy.finding.add}
            </Button>
            {selected && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelected(null);
                  setType("");
                  setNote("");
                }}
              >
                {copy.finding.cancel}
              </Button>
            )}
          </div>
          {findings.length >= MAX_FINDINGS && (
            <p className="text-muted-foreground text-xs">
              {copy.findings.max(MAX_FINDINGS)}
            </p>
          )}
        </section>

        <section
          aria-labelledby="findings-title"
          className="bg-card space-y-2 rounded-xl border p-4"
        >
          <h2 id="findings-title" className="font-heading font-semibold">
            {copy.findings.title}
          </h2>
          {findings.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {copy.findings.empty}
            </p>
          ) : (
            <ol className="space-y-2">
              {findings.map((finding, index) => {
                const region = labelOf.get(finding.regionId) ?? "";
                const kind = copy.issues[finding.type].label;
                return (
                  <li
                    key={`${finding.regionId}-${finding.type}-${index}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{kind}</p>
                      <p className="text-muted-foreground text-xs">{region}</p>
                      {finding.note && (
                        <p className="mt-0.5 text-xs">{finding.note}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={copy.findings.remove(region, kind)}
                      onClick={() =>
                        setFindings(findings.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
          <Button
            type="button"
            className="mt-2 w-full"
            variant="secondary"
            disabled={findings.length === 0}
            onClick={() => {
              clearError();
              setConfirming(true);
            }}
          >
            {copy.submit.button}
          </Button>
        </section>
      </aside>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.submit.confirmTitle}</DialogTitle>
            <DialogDescription>{copy.submit.confirmBody}</DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
            >
              {copy.submit.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || findings.length === 0}
              onClick={() => submitAnswer({ findings })}
            >
              {isSubmitting ? copy.submit.submitting : copy.submit.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
