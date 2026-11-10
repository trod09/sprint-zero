"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { CaseSummary } from "@/components/case-library";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAttemptStore } from "@/core/storage";
import { getMessages } from "@/i18n";
import { caseLabel } from "@/lib/case-label";
import { useAttempts } from "@/lib/use-attempts";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Attempts saved in this browser, newest first. */
export function AttemptHistory({ cases }: { cases: CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.history;
  const { attempts, reload } = useAttempts();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const byId = new Map(cases.map((c) => [c.id, c]));

  if (attempts === null) {
    return (
      <p role="status" className="text-muted-foreground py-10 text-sm">
        {copy.loading}
      </p>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="text-muted-foreground">{copy.empty}</p>
        <Button asChild className="mt-4">
          <Link href="/library">{copy.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  const average = Math.round(
    attempts.reduce((sum, a) => sum + a.result.total, 0) / attempts.length,
  );

  const remove = async (id: string) => {
    try {
      await getAttemptStore().deleteAttempt(id);
    } finally {
      reload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          {copy.played(attempts.length)} · {copy.average(average)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmingClear(true)}
        >
          {copy.clearAll}
        </Button>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border">
        {attempts.map((attempt) => {
          const summary = caseLabel(attempt.caseId, byId);
          const title = summary?.title ?? copy.unknownCase;
          return (
            <li key={attempt.id} className="flex items-center gap-4 px-4 py-3">
              <span
                className={cn(
                  "w-12 shrink-0 text-center font-mono text-lg font-semibold tabular-nums",
                  attempt.result.total >= 80
                    ? "text-emerald-700 dark:text-emerald-400"
                    : attempt.result.total >= 50
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-destructive",
                )}
              >
                {attempt.result.total}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {summary ? `${summary.moduleName} · ` : ""}
                  {dateFormat.format(new Date(attempt.submittedAt))}
                </p>
              </div>
              {summary && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/results/${attempt.id}`}>
                    {copy.viewResults}
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={copy.deleteLabel(title)}
                onClick={() => void remove(attempt.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.clearTitle}</DialogTitle>
            <DialogDescription>{copy.clearBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingClear(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                try {
                  await getAttemptStore().clear();
                } finally {
                  setConfirmingClear(false);
                  reload();
                }
              }}
            >
              {copy.clearConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
