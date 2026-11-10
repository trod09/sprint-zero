/**
 * Pure rules of a structured Product Case, shared by the generator (to check
 * a case has one best answer) and by scoring (to grade the learner).
 *
 * - A problem matters to a segment by its severity for that segment (0-3).
 * - A solution's value is how much it relieves the chosen problems, weighted
 *   by how much they hurt: sum of relief x severity.
 * - Its priority is value per unit of effort (S = 1, M = 2, L = 3).
 */
import { EFFORT_POINTS, type StructuredCase } from "./schema";

export interface WeightedProblem {
  id: string;
  severity: number;
}

/** Every problem with its severity for one segment, in case order. */
export function segmentSeverities(
  caseData: Pick<StructuredCase, "hidden">,
  segmentId: string,
): WeightedProblem[] {
  return caseData.hidden.problems.map((problem) => ({
    id: problem.id,
    severity: problem.severity[segmentId] ?? 0,
  }));
}

/** The problems that hurt a segment most; ties keep case order. */
export function topProblems(
  caseData: Pick<StructuredCase, "hidden">,
  segmentId: string,
  count = 2,
): WeightedProblem[] {
  return [...segmentSeverities(caseData, segmentId)]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, count);
}

export interface RankedSolution {
  id: string;
  value: number;
  effort: number;
  priority: number;
}

/** Solutions by priority for the given problems, best first. */
export function rankSolutions(
  caseData: Pick<StructuredCase, "hidden" | "solutions">,
  problems: readonly WeightedProblem[],
): RankedSolution[] {
  const effortOf = new Map(
    caseData.solutions.map((solution) => [
      solution.id,
      EFFORT_POINTS[solution.effort],
    ]),
  );
  return caseData.hidden.solutions
    .map((solution) => {
      const value = problems.reduce(
        (sum, problem) =>
          sum + (solution.relief[problem.id] ?? 0) * problem.severity,
        0,
      );
      const effort = effortOf.get(solution.id) ?? 3;
      return { id: solution.id, value, effort, priority: value / effort };
    })
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        b.value - a.value ||
        a.id.localeCompare(b.id),
    );
}

/** The best segment: the one with the highest fit. */
export function bestSegmentId(caseData: Pick<StructuredCase, "hidden">) {
  return [...caseData.hidden.segments].sort((a, b) => b.fit - a.fit)[0].id;
}
