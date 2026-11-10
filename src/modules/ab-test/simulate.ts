/**
 * Turns an experiment design and its hidden simulation parameters into the
 * counts the learner reads. Deterministic: the same case seed and attempt
 * always give the same counts.
 */
import { createRng, type Rng } from "@/core/rng";

import type {
  AbTestCase,
  Arms,
  Guardrail,
  ProportionCounts,
  Simulation,
} from "./schema";

type Results = AbTestCase["results"];

/** Traffic by day of the week, starting on a Monday. */
const WEEKDAY_TRAFFIC = [1.03, 1.05, 1.04, 1.02, 0.98, 0.92, 0.96];

/** Binomial draw with the normal approximation; counts here are large. */
function binomial(rng: Rng, n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  const draw = rng.normal(n * p, Math.sqrt(n * p * (1 - p)));
  return Math.min(n, Math.max(0, Math.round(draw)));
}

const emptyArms = (): Arms => ({
  control: { users: 0, conversions: 0 },
  treatment: { users: 0, conversions: 0 },
});

function add(target: ProportionCounts, users: number, conversions: number) {
  target.users += users;
  target.conversions += conversions;
}

/** Days the experiment actually ran. */
export function daysRun(simulation: Simulation, plannedDays: number): number {
  return simulation.stoppedAfterDays ?? plannedDays;
}

export function simulateResults(
  seed: number,
  simulation: Simulation,
  plannedDays: number,
  guardrails: readonly Guardrail[],
): Results {
  const rng = createRng(seed).fork(`attempt-${simulation.attempt}`);
  const traffic = rng.fork("traffic");
  const outcomes = rng.fork("outcomes");
  const days = daysRun(simulation, plannedDays);
  const totalShare = simulation.segments.reduce((sum, s) => sum + s.share, 0);

  const daily: Arms[] = [];
  const segments = simulation.segments.map((segment) => ({
    value: segment.value,
    ...emptyArms(),
  }));

  for (let day = 0; day < days; day++) {
    const visitors = Math.round(
      simulation.visitorsPerDay *
        WEEKDAY_TRAFFIC[day % 7] *
        (1 + traffic.normal(0, 0.03)),
    );
    const today = emptyArms();
    simulation.segments.forEach((segment, index) => {
      const users = Math.round((visitors * segment.share) / totalShare);
      const share = segment.treatmentShare ?? simulation.treatmentShare;
      const assigned = binomial(traffic, users, share);
      const controlUsers = users - assigned;
      const lost = simulation.missing
        ? binomial(traffic, assigned, simulation.missing.share)
        : 0;
      const treatmentUsers = assigned - lost;

      const controlRate = simulation.baselineRate * segment.rateMultiplier;
      const novelty = simulation.novelty
        ? simulation.novelty.initialLift *
          Math.exp(-day / simulation.novelty.decayDays)
        : 0;
      const lift = (segment.trueLift ?? simulation.trueLift) + novelty;
      let treatmentRate = controlRate * (1 + lift);
      if (simulation.missing) {
        // The users who never get logged convert less, so the logged ones look better.
        const { share: lostShare, relativeRate } = simulation.missing;
        treatmentRate =
          (treatmentRate * (1 - lostShare * relativeRate)) / (1 - lostShare);
      }

      const controlConversions = binomial(outcomes, controlUsers, controlRate);
      const treatmentConversions = binomial(
        outcomes,
        treatmentUsers,
        Math.min(1, treatmentRate),
      );
      add(today.control, controlUsers, controlConversions);
      add(today.treatment, treatmentUsers, treatmentConversions);
      add(segments[index].control, controlUsers, controlConversions);
      add(segments[index].treatment, treatmentUsers, treatmentConversions);
    });
    daily.push(today);
  }

  const totals = emptyArms();
  for (const day of daily) {
    add(totals.control, day.control.users, day.control.conversions);
    add(totals.treatment, day.treatment.users, day.treatment.conversions);
  }

  const guardrailRng = rng.fork("guardrails");
  const guardrailResults = guardrails.map((guardrail) => {
    const spec = simulation.guardrails.find((g) => g.key === guardrail.key);
    if (!spec) {
      throw new Error(`Guardrail "${guardrail.key}" has no simulation`);
    }
    const base = (arm: ProportionCounts) =>
      guardrail.denominator === "users" ? arm.users : arm.conversions;
    const controlBase = base(totals.control);
    const treatmentBase = base(totals.treatment);
    return {
      key: guardrail.key,
      control: {
        users: controlBase,
        conversions: binomial(guardrailRng, controlBase, spec.baselineRate),
      },
      treatment: {
        users: treatmentBase,
        conversions: binomial(
          guardrailRng,
          treatmentBase,
          Math.min(1, spec.baselineRate * (1 + spec.trueLift)),
        ),
      },
    };
  });

  return {
    daysRun: days,
    daily,
    segments,
    guardrails: guardrailResults,
  };
}
