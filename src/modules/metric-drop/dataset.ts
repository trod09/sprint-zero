/**
 * Seeded generator of the daily analytics data behind a Metric Drop case.
 *
 * The data is a cube of cells (platform x app version x country x channel x
 * user type), each with daily counters. Every number comes from the case's
 * seed and specification, so the same case always yields the same data.
 */
import { createRng, type Rng } from "@/core/rng";

import {
  CHANNELS,
  COUNTRIES,
  PLATFORMS,
  USER_TYPES,
  type Anomaly,
  type Dimension,
  type MetricDropCase,
  type Platform,
  type Segment,
} from "./schema";

export type CellDimensions = Record<Dimension, string>;

export interface Cell {
  dims: CellDimensions;
  /** Active users that day (new users count as active on their signup day). */
  active: Int32Array;
  signups: Int32Array;
  activated: Int32Array;
  sessions: Int32Array;
  purchases: Int32Array;
}

export interface Dataset {
  days: number;
  /** ISO dates, one per day. */
  dates: string[];
  cells: Cell[];
}

const BASE_SHARES = {
  platform: { ios: 0.42, android: 0.38, web: 0.2 },
  country: { US: 0.35, GB: 0.15, DE: 0.15, BR: 0.15, IN: 0.2 },
  channel: {
    organic: 0.45,
    paid_search: 0.2,
    paid_social: 0.2,
    referral: 0.15,
  },
} as const;

/** Monday to Sunday. Consumer products dip at the weekend. */
const WEEKDAY_FACTORS = [1.0, 1.02, 1.03, 1.02, 0.98, 0.88, 0.86];
const DAILY_GROWTH = 0.001;
const NOISE = 0.03;
/** New users of the latest version, as a share of the platform, at most. */
const MAX_ADOPTION = 0.8;
const ADOPTION_DAYS = 3;
/** How much returning users depend on recent activation (see `retentionHealth`). */
const ACTIVATION_DEPENDENCY = 0.15;
const HEALTH_WINDOW = 14;
const NEW_USER_SESSIONS = 0.8;
const NEW_USER_CONVERSION = 0.5;

/** Shares jittered by the seed, then normalised. */
function jitteredShares<K extends string>(
  base: Record<K, number>,
  rng: Rng,
): Record<K, number> {
  const entries = Object.entries(base) as [K, number][];
  const jittered = entries.map(
    ([key, share]) => [key, share * rng.float(0.9, 1.1)] as const,
  );
  const total = jittered.reduce((sum, [, share]) => sum + share, 0);
  return Object.fromEntries(
    jittered.map(([key, share]) => [key, share / total]),
  ) as Record<K, number>;
}

export function dateOf(startDate: string, day: number): string {
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}

function weekdayFactor(startDate: string, day: number): number {
  // getUTCDay: 0 is Sunday. WEEKDAY_FACTORS starts on Monday.
  const weekday = new Date(`${dateOf(startDate, day)}T00:00:00Z`).getUTCDay();
  return WEEKDAY_FACTORS[(weekday + 6) % 7];
}

function adoption(day: number, releaseDay: number): number {
  if (day < releaseDay) return 0;
  return MAX_ADOPTION * (1 - Math.exp(-(day - releaseDay + 1) / ADOPTION_DAYS));
}

export function matchesSegment(
  dims: CellDimensions,
  segment: Segment,
): boolean {
  return (Object.entries(segment) as [Dimension, string | undefined][]).every(
    ([dimension, value]) => value === undefined || dims[dimension] === value,
  );
}

/** Combined multiplier of the anomalies that hit a cell and target on a day. */
export function anomalyFactor(
  anomalies: readonly Anomaly[],
  dims: CellDimensions,
  target: Anomaly["target"],
  day: number,
): number {
  let factor = 1;
  for (const anomaly of anomalies) {
    if (anomaly.target !== target || day < anomaly.startDay) continue;
    if (anomaly.endDay !== undefined && day > anomaly.endDay) continue;
    if (!matchesSegment(dims, anomaly.segment)) continue;
    const ramp = Math.min(1, (day - anomaly.startDay + 1) / anomaly.rampDays);
    factor *= 1 - (1 - anomaly.multiplier) * ramp;
  }
  return factor;
}

export function allAnomalies(caseData: MetricDropCase): Anomaly[] {
  return [
    ...caseData.hidden.rootCause.anomalies,
    ...caseData.hidden.falseLeads.flatMap((lead) => lead.anomalies),
  ];
}

function versionsOf(platform: Platform, release: MetricDropCase["release"]) {
  return platform === "web"
    ? [{ value: "web", isNext: false }]
    : [
        { value: `${platform}-${release.previous}`, isNext: false },
        { value: `${platform}-${release.next}`, isNext: true },
      ];
}

/** Every combination of dimensions in a case, in a fixed order. */
export function enumerateCells(
  release: MetricDropCase["release"],
): CellDimensions[] {
  const cells: CellDimensions[] = [];
  for (const platform of PLATFORMS) {
    for (const version of versionsOf(platform, release)) {
      for (const country of COUNTRIES) {
        for (const channel of CHANNELS) {
          for (const userType of USER_TYPES) {
            cells.push({
              platform,
              appVersion: version.value,
              country,
              channel,
              userType,
            });
          }
        }
      }
    }
  }
  return cells;
}

export function buildDataset(caseData: MetricDropCase): Dataset {
  const { days, startDate, scale, rates, release } = caseData;
  const root = createRng(caseData.seed);
  const shareRng = root.fork("shares");
  const shares = {
    platform: jitteredShares(BASE_SHARES.platform, shareRng.fork("platform")),
    country: jitteredShares(BASE_SHARES.country, shareRng.fork("country")),
    channel: jitteredShares(BASE_SHARES.channel, shareRng.fork("channel")),
  };
  const anomalies = allAnomalies(caseData);
  const dates = Array.from({ length: days }, (_, day) =>
    dateOf(startDate, day),
  );
  const calendar = Array.from(
    { length: days },
    (_, day) => weekdayFactor(startDate, day) * (1 + DAILY_GROWTH) ** day,
  );

  const cells: Cell[] = [];
  for (const platform of PLATFORMS) {
    for (const version of versionsOf(platform, release)) {
      for (const country of COUNTRIES) {
        for (const channel of CHANNELS) {
          const baseShare =
            shares.platform[platform] *
            shares.country[country] *
            shares.channel[channel];
          for (const userType of USER_TYPES) {
            const dims: CellDimensions = {
              platform,
              appVersion: version.value,
              country,
              channel,
              userType,
            };
            const rng = root.fork(
              `cell:${platform}:${version.value}:${country}:${channel}:${userType}`,
            );
            const cell: Cell = {
              dims,
              active: new Int32Array(days),
              signups: new Int32Array(days),
              activated: new Int32Array(days),
              sessions: new Int32Array(days),
              purchases: new Int32Array(days),
            };
            const noise = () => Math.max(0, 1 + rng.normal(0, NOISE));
            // Activation trouble among new users of this kind of user thins
            // out returning users over the following two weeks.
            const newDims = { ...dims, userType: "new" };
            const activationEffect = (day: number) =>
              anomalyFactor(anomalies, newDims, "activation", day);

            for (let day = 0; day < days; day++) {
              const versionShare =
                platform === "web"
                  ? 1
                  : version.isNext
                    ? adoption(day, release.day)
                    : 1 - adoption(day, release.day);
              const effect = (target: Anomaly["target"]) =>
                anomalyFactor(anomalies, dims, target, day);
              let active: number;
              if (userType === "new") {
                const signups =
                  scale.signups *
                  baseShare *
                  calendar[day] *
                  versionShare *
                  effect("signups") *
                  noise();
                const activated =
                  signups * rates.activation * effect("activation") * noise();
                cell.signups[day] = Math.round(signups);
                cell.activated[day] = Math.min(
                  cell.signups[day],
                  Math.round(activated),
                );
                active = signups;
              } else {
                let health = 0;
                for (let back = 1; back <= HEALTH_WINDOW; back++) {
                  health += day - back >= 0 ? activationEffect(day - back) : 1;
                }
                health /= HEALTH_WINDOW;
                active =
                  scale.returning *
                  baseShare *
                  calendar[day] *
                  versionShare *
                  effect("returning") *
                  (1 - ACTIVATION_DEPENDENCY + ACTIVATION_DEPENDENCY * health) *
                  noise();
              }
              cell.active[day] = Math.round(active);
              const sessionRate =
                rates.sessionsPerUser *
                (userType === "new" ? NEW_USER_SESSIONS : 1);
              cell.sessions[day] = Math.round(
                active * sessionRate * effect("sessions") * noise(),
              );
              const conversionRate =
                rates.conversion *
                (userType === "new" ? NEW_USER_CONVERSION : 1);
              cell.purchases[day] = Math.round(
                active * conversionRate * effect("conversion") * noise(),
              );
            }
            cells.push(cell);
          }
        }
      }
    }
  }
  return { days, dates, cells };
}
