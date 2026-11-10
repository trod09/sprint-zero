"use client";

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
import type { ScoreResult } from "@/core/scoring";
import { getMessages } from "@/i18n";

export function SubmitDialog({
  open,
  onOpenChange,
  error,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const copy = getMessages().productCase.submit;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.confirmTitle}</DialogTitle>
          <DialogDescription>{copy.confirmBody}</DialogDescription>
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
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? copy.submitting : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Shown in place of the case when the score came back but could not be stored. */
export function InlineResult({ result }: { result: ScoreResult }) {
  return (
    <section className="bg-card rounded-xl border p-6">
      <p className="font-heading text-5xl font-semibold tabular-nums">
        {result.total}
        <span className="text-muted-foreground text-lg"> / 100</span>
      </p>
      <div className="mt-6">
        <ScoreBreakdown criteria={result.criteria} />
      </div>
    </section>
  );
}
