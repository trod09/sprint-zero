"use client";

import { useEffect } from "react";

import { recordLastCase } from "@/lib/last-case";

/** Remembers the open case for "Jump back in" on the home page. */
export function RecordLastCase({ caseId }: { caseId: string }) {
  useEffect(() => {
    recordLastCase(caseId);
  }, [caseId]);
  return null;
}
