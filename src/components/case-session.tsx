"use client";

/**
 * Starts the case afresh once an attempt at it is saved. Next.js keeps the
 * state of pages already visited, so without this a learner coming back
 * from the results ("Play again") would find their old answer and an open
 * submit dialog. Only attempts made after this page opened count, so loading
 * the history never resets work in progress.
 */
import { Fragment, useState, type ReactNode } from "react";

import { useAttempts } from "@/lib/use-attempts";

export function CaseSession({
  caseId,
  children,
}: {
  caseId: string;
  children: ReactNode;
}) {
  const [openedAt] = useState(() => new Date().toISOString());
  const { attempts } = useAttempts();
  const submitted = (attempts ?? []).filter(
    (attempt) => attempt.caseId === caseId && attempt.submittedAt >= openedAt,
  ).length;
  return <Fragment key={submitted}>{children}</Fragment>;
}
