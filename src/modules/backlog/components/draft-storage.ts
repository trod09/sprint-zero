/**
 * Keeps an unfinished plan in the browser, so a refresh does not lose work.
 * Storage is user-editable, so a draft is validated and cleaned before use.
 */
import {
  initialPlanningState,
  planningStateSchema,
  sanitizePlanningState,
  type PlanningState,
} from "../planning";

const draftKey = (caseId: string) => `sprint-zero:backlog-draft:v1:${caseId}`;

export function loadDraft(
  caseId: string,
  ticketIds: ReadonlySet<string>,
): PlanningState {
  try {
    const raw = window.localStorage.getItem(draftKey(caseId));
    if (!raw) return initialPlanningState;
    const parsed = planningStateSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? sanitizePlanningState(parsed.data, ticketIds)
      : initialPlanningState;
  } catch {
    return initialPlanningState;
  }
}

export function saveDraft(caseId: string, state: PlanningState): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(state));
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
