"use client";

/**
 * The mission HUD: a bar pinned to the bottom of every case with the case's
 * objectives, how many are done, and its primary action. Each module
 * registers what it needs with `useMission`; the bar looks and behaves the
 * same everywhere, so the learner always knows what is left and where the
 * button is.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { ModuleSprite, PixelIcon } from "./icons";

export interface Objective {
  id: string;
  label: string;
  done: boolean;
}

export interface MissionAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** What is missing, shown next to a disabled action. */
  hint?: string;
}

export interface Mission {
  objectives: readonly Objective[];
  action?: MissionAction;
}

type Register = (mission: Mission | null) => void;
const MissionContext = createContext<Register | null>(null);

export function MissionProvider({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  const [mission, setMission] = useState<Mission | null>(null);
  return (
    <MissionContext.Provider value={setMission}>
      {children}
      {mission && <MissionHud moduleId={moduleId} mission={mission} />}
    </MissionContext.Provider>
  );
}

/**
 * Registers the case's objectives and primary action. Call it on every
 * render of the workspace; it only updates the bar when something visible
 * changes.
 */
export function useMission(mission: Mission | null) {
  const register = useContext(MissionContext);
  const onClick = useRef<(() => void) | undefined>(undefined);
  const latestClick = mission?.action?.onClick;
  // Keep the latest handler without re-registering the bar on every render.
  useEffect(() => {
    onClick.current = latestClick;
  });
  const key = mission
    ? JSON.stringify([
        mission.objectives,
        mission.action?.label,
        mission.action?.disabled,
        mission.action?.hint,
      ])
    : null;

  useEffect(() => {
    if (!register) return;
    if (!mission || key === null) {
      register(null);
      return;
    }
    register({
      objectives: mission.objectives,
      action: mission.action && {
        ...mission.action,
        onClick: () => onClick.current?.(),
      },
    });
    // `key` captures everything the bar shows; the click goes through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, key]);

  useEffect(() => () => register?.(null), [register]);
}

function MissionHud({
  moduleId,
  mission,
}: {
  moduleId: string;
  mission: Mission;
}) {
  const copy = getMessages().arcade.mission;
  const { objectives, action } = mission;
  const done = objectives.filter((objective) => objective.done).length;
  const next = objectives.find((objective) => !objective.done);

  return (
    <div className="pointer-events-none sticky bottom-3 z-30 mt-8">
      <section
        aria-label={copy.label}
        className="pixel-card pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:flex-nowrap"
      >
        <div className="rounded-sm bg-[#0a0e1f] p-1" aria-hidden="true">
          <ModuleSprite moduleId={moduleId} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-pixel text-xs tracking-wide">
              {copy.objectives}{" "}
              <span className="text-muted-foreground tabular-nums">
                {done}/{objectives.length}
              </span>
            </p>
            <div
              className="flex h-2 max-w-48 flex-1 gap-0.5"
              role="img"
              aria-label={copy.progress(done, objectives.length)}
            >
              {objectives.map((objective) => (
                <span
                  key={objective.id}
                  className={cn(
                    "flex-1 rounded-[1px] transition-colors",
                    !objective.done && "bg-muted",
                  )}
                  style={
                    objective.done
                      ? { background: "var(--world-ink, var(--success))" }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
          <ol className="mt-1 hidden flex-wrap gap-x-3 gap-y-0.5 text-xs md:flex">
            {objectives.map((objective) => (
              <li
                key={objective.id}
                className={cn(
                  "flex items-center gap-1",
                  objective.done
                    ? "text-muted-foreground line-through decoration-1"
                    : objective === next
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground",
                )}
              >
                <span aria-hidden="true">
                  {objective.done ? (
                    <PixelIcon
                      name="check"
                      size={10}
                      className="text-success"
                    />
                  ) : (
                    <span className="border-frame inline-block size-2.5 rounded-[1px] border" />
                  )}
                </span>
                <span>
                  {objective.label}
                  <span className="sr-only">
                    {objective.done ? ` (${copy.done})` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          {next && (
            <p className="text-muted-foreground mt-0.5 text-xs md:hidden">
              {copy.next(next.label)}
            </p>
          )}
        </div>
        {action && (
          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            {action.disabled && action.hint && (
              <p className="text-muted-foreground hidden max-w-56 text-right text-xs lg:block">
                {action.hint}
              </p>
            )}
            <Button
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className="w-full sm:w-auto"
            >
              {action.label}
              <PixelIcon name="play" size={12} />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
