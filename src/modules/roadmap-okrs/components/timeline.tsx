/**
 * The quarter as a grid: one lane per team, one column per sprint, and a bar
 * per scheduled initiative. Read-only; the workspace owns the controls.
 */
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { PlannedItem, PlacementStatus } from "../planning";
import { SPRINTS, type PublicRoadmapCase } from "../schema";

const BAR_STYLE: Record<PlacementStatus, string> = {
  ok: "border-frame bg-[var(--module-roadmap-okrs)] text-[#0a0e1f]",
  blocked: "border-warning bg-warning/15 text-foreground border-dashed",
  overlap: "border-destructive bg-destructive/15 text-foreground border-dashed",
  overflow:
    "border-destructive bg-destructive/15 text-foreground border-dashed",
};

/** Rows inside a lane, so overlapping bars stack instead of hiding each other. */
function layoutRows(items: readonly PlannedItem[]): Map<string, number> {
  const rows: number[] = [];
  const rowOf = new Map<string, number>();
  for (const item of [...items].sort((a, b) => a.startSprint - b.startSprint)) {
    let row = rows.findIndex((busyUntil) => busyUntil < item.startSprint);
    if (row === -1) row = rows.length;
    rows[row] = item.endSprint;
    rowOf.set(item.initiativeId, row);
  }
  return rowOf;
}

export function Timeline({
  teams,
  initiatives,
  items,
  selectedId,
  onSelect,
  labelledBy,
}: {
  teams: PublicRoadmapCase["teams"];
  initiatives: PublicRoadmapCase["initiatives"];
  items: readonly PlannedItem[];
  selectedId?: string | null;
  onSelect?: (initiativeId: string) => void;
  labelledBy?: string;
}) {
  const copy = getMessages().roadmap.board;
  const title = new Map(initiatives.map((i) => [i.id, i.title]));
  const sprints = Array.from({ length: SPRINTS }, (_, index) => index + 1);

  return (
    <div className="overflow-x-auto">
      <div
        role="table"
        aria-labelledby={labelledBy}
        className="min-w-[38rem] text-sm"
      >
        <div
          role="row"
          className="text-muted-foreground grid grid-cols-[9rem_repeat(6,minmax(0,1fr))] gap-px text-xs"
        >
          <div role="columnheader" className="px-2 py-1">
            {copy.team}
          </div>
          {sprints.map((sprint) => (
            <div
              role="columnheader"
              key={sprint}
              className="font-pixel px-2 py-1 text-center"
            >
              <span aria-hidden="true">{copy.sprintShort(sprint)}</span>
              <span className="sr-only">{copy.sprint(sprint)}</span>
            </div>
          ))}
        </div>
        {teams.map((team) => {
          const lane = items.filter((item) => item.teamId === team.id);
          const rowOf = layoutRows(lane);
          const rowCount = Math.max(
            1,
            ...[...rowOf.values()].map((r) => r + 1),
          );
          const used = lane.reduce(
            (total, item) =>
              total +
              (Math.min(item.endSprint, SPRINTS) - item.startSprint + 1),
            0,
          );
          return (
            <div
              role="row"
              key={team.id}
              className="grid grid-cols-[9rem_minmax(0,1fr)] border-t"
            >
              <div role="rowheader" className="px-2 py-2">
                <p className="leading-tight font-medium">{team.name}</p>
                <p
                  className={cn(
                    "mt-0.5 font-mono text-xs tabular-nums",
                    used > SPRINTS
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {copy.capacity(used, SPRINTS)}
                  {used > SPRINTS && ` · ${copy.overbooked}`}
                </p>
              </div>
              <div
                role="cell"
                className="relative grid grid-cols-6 gap-x-1 gap-y-1 py-2"
                style={{
                  gridTemplateRows: `repeat(${rowCount}, minmax(2.25rem, auto))`,
                }}
              >
                {/* Sprint guides behind the bars. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-x-1"
                >
                  {sprints.map((sprint) => (
                    <div key={sprint} className="bg-muted/40 rounded-sm" />
                  ))}
                </div>
                {lane.length === 0 && (
                  <p className="text-muted-foreground relative col-span-6 self-center px-2 text-xs">
                    {copy.empty}
                  </p>
                )}
                {lane.map((item) => {
                  const end = Math.min(item.endSprint, SPRINTS);
                  const name =
                    title.get(item.initiativeId) ?? item.initiativeId;
                  const label = copy.barLabel(
                    name,
                    item.startSprint,
                    item.endSprint,
                    copy.statusShort[item.status],
                  );
                  const className = cn(
                    "relative flex min-w-0 items-center gap-1 rounded-sm border-2 px-1.5 py-1 text-left text-xs leading-tight font-semibold",
                    BAR_STYLE[item.status],
                    selectedId === item.initiativeId &&
                      "ring-ring ring-2 ring-offset-1",
                    onSelect &&
                      "focus-visible:ring-ring/50 cursor-pointer focus-visible:ring-3 focus-visible:outline-none",
                  );
                  const style = {
                    gridColumn: `${item.startSprint} / ${end + 1}`,
                    gridRow: (rowOf.get(item.initiativeId) ?? 0) + 1,
                  };
                  const content = (
                    <>
                      <span className="truncate">{name}</span>
                      {item.status !== "ok" && (
                        <span className="font-pixel ml-auto shrink-0 text-xs uppercase">
                          {copy.statusShort[item.status]}
                        </span>
                      )}
                    </>
                  );
                  return onSelect ? (
                    <button
                      type="button"
                      key={item.initiativeId}
                      className={className}
                      style={style}
                      aria-label={label}
                      title={name}
                      onClick={() => onSelect(item.initiativeId)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={item.initiativeId}
                      className={className}
                      style={style}
                      title={name}
                    >
                      <span className="sr-only">{label}</span>
                      <span aria-hidden="true" className="contents">
                        {content}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
