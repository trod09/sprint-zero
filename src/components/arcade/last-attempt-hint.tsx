"use client";

/**
 * On a case already played in this browser: the last score and the criteria
 * that cost the most points. It only uses the stored attempt, which already
 * holds the score breakdown, so nothing about the solution is revealed.
 */
import { getMessages } from "@/i18n";
import { useAttempts } from "@/lib/use-attempts";

const FOCUS_COUNT = 2;

export function LastAttemptHint({ caseId }: { caseId: string }) {
  const copy = getMessages().learn.lastTime;
  const { attempts } = useAttempts();
  const mine = (attempts ?? []).filter((attempt) => attempt.caseId === caseId);
  const last = mine[0];
  if (!last) return null;

  const weakest = [...last.result.criteria]
    .filter((criterion) => criterion.ratio < 1)
    .sort(
      (a, b) =>
        b.weight * (1 - b.ratio) - a.weight * (1 - a.ratio) ||
        a.ratio - b.ratio,
    )
    .slice(0, FOCUS_COUNT);

  return (
    <aside
      aria-label={copy.title(last.result.total)}
      className="border-warning bg-warning/10 rounded-md border-2 px-4 py-3 text-sm"
    >
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-pixel text-warning">
          {copy.title(last.result.total)}
        </span>
        <span className="text-muted-foreground text-xs">
          {copy.attempts(mine.length)}
        </span>
      </p>
      {weakest.length === 0 ? (
        <p className="mt-1">{copy.perfect}</p>
      ) : (
        <>
          <p className="mt-1 font-medium">{copy.focus}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {weakest.map((criterion) => (
              <li key={criterion.id}>
                <span className="font-medium">{criterion.label}</span>
                {criterion.detail && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {criterion.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
