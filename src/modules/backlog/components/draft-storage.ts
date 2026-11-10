/**
 * Keeps an unfinished case in the browser, so a refresh does not lose work.
 * Storage is user-editable, so a draft is validated and cleaned before use.
 */
import {
  initialPlanningDraft,
  planningDraftSchema,
  sanitizePlanningDraft,
  type PlanningDraft,
} from "../planning";

const draftKey = (caseId: string) => `sprint-zero:backlog-draft:v2:${caseId}`;

export function loadDraft(
  caseId: string,
  backlogTicketIds: ReadonlySet<string>,
): PlanningDraft {
  try {
    const raw = window.localStorage.getItem(draftKey(caseId));
    if (!raw) return initialPlanningDraft;
    const parsed = planningDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? sanitizePlanningDraft(parsed.data, backlogTicketIds)
      : initialPlanningDraft;
  } catch {
    return initialPlanningDraft;
  }
}

export function saveDraft(caseId: string, draft: PlanningDraft): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(draft));
  } catch {
    // Storage full or disabled: the plan still works for this visit.
  }
}

export function clearDraft(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}
