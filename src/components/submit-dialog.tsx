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

export interface SubmitDialogCopy {
  confirmTitle: string;
  confirmBody: string;
  confirm: string;
  cancel: string;
  submitting: string;
}

/** Confirms a submission and shows why it failed, if it did. */
export function SubmitDialog({
  copy,
  open,
  onOpenChange,
  error,
  isSubmitting,
  onConfirm,
}: {
  copy: SubmitDialogCopy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
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
    <section className="pixel-card p-6">
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
