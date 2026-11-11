"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { NativeSelect } from "@/components/ui/native-select";
import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import type { SubmissionOutcome } from "@/core/case-engine/submission";
import type { ScoreResult } from "@/core/scoring";
import { getAttemptStore } from "@/core/storage";
import { getMessages } from "@/i18n";
import { notifyAttemptsChanged } from "@/lib/use-attempts";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

import {
  addedTickets,
  capacityAfterEvents,
  fillSprint,
  initialPlanningDraft,
  MOSCOW_BUCKETS,
  orderByMoscow,
  planningReducer,
  rankByRice,
  riceScore,
  splitByCapacity,
  type MoscowBucket,
  type PlanningDraft,
} from "../planning";
import {
  PLANNING_METHODS,
  TICKET_TYPES,
  type BacklogAnswer,
  type PlanningMethod,
  type PublicBacklogCase,
  type PublicTicket,
  type TicketType,
} from "../schema";
import type { RevealEventsOutcome } from "../events.server";
import { clearDraft, loadDraft, saveDraft } from "./draft-storage";
import { EventCard } from "./event-card";
import { MoscowControls, RiceControls } from "./method-controls";
import { SPRINT_ZONE_ID, SprintPanel, sprintDragId } from "./sprint-panel";
import { SprintResult } from "./sprint-result";
import { EffortPill, TicketTypeIcon } from "./ticket-meta";
import { TicketRow } from "./ticket-row";
import { TicketSheet } from "./ticket-sheet";

export type SubmitAttempt = (input: unknown) => Promise<SubmissionOutcome>;
export type RevealEvents = (input: unknown) => Promise<RevealEventsOutcome>;

const BACKLOG_ZONE_ID = "backlog-zone";

/**
 * Entry point. The server renders an empty plan; once in the browser the
 * planner remounts with the saved draft, which avoids a hydration mismatch.
 */
export function BacklogWorkspace({
  publicCase,
  submit,
  revealEvents,
}: {
  publicCase: PublicBacklogCase;
  submit: SubmitAttempt;
  revealEvents: RevealEvents;
}) {
  const isClient = useIsClient();
  const initialDraft = useMemo(
    () =>
      isClient
        ? loadDraft(
            publicCase.id,
            new Set(publicCase.tickets.map((ticket) => ticket.id)),
          )
        : initialPlanningDraft,
    [isClient, publicCase],
  );
  return (
    <Planner
      key={isClient ? "client" : "server"}
      publicCase={publicCase}
      initialDraft={initialDraft}
      submit={submit}
      revealEvents={revealEvents}
      persist={isClient}
    />
  );
}

/** Ticket id behind a drag id such as "sprint:PAY-12". */
function ticketIdOf(dragId: UniqueIdentifier): string | null {
  const value = String(dragId);
  const separator = value.indexOf(":");
  return separator === -1 ? null : value.slice(separator + 1);
}

/**
 * With a pointer, only what is under it counts, so dropping on empty space
 * does nothing. Keyboard drags have no pointer and move to the nearest target.
 */
const collisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);

/** The backlog list as a drop target: dropping a sprint ticket here removes it. */
function BacklogDropZone({
  isDragging,
  children,
}: {
  isDragging: boolean;
  children: React.ReactNode;
}) {
  // Must render inside DndContext to register as a drop target.
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_ZONE_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-frame bg-card shadow-pixel overflow-hidden rounded-md border-2 transition-colors",
        isOver && isDragging && "border-primary bg-primary/5",
      )}
    >
      {children}
    </div>
  );
}

interface Filters {
  type: TicketType | "all";
  requester: string;
  query: string;
}
const NO_FILTERS: Filters = { type: "all", requester: "all", query: "" };

function matchesFilters(ticket: PublicTicket, filters: Filters): boolean {
  if (filters.type !== "all" && ticket.type !== filters.type) return false;
  if (filters.requester !== "all" && ticket.stakeholderId !== filters.requester)
    return false;
  const query = filters.query.trim().toLowerCase();
  if (!query) return true;
  return (
    ticket.title.toLowerCase().includes(query) ||
    ticket.id.toLowerCase().includes(query)
  );
}

type Phase =
  | { name: "planning" }
  | { name: "confirming"; error?: string }
  /** The events were just revealed and are shown in a dialog. */
  | { name: "event" }
  | { name: "done"; result: ScoreResult };

type Committed = NonNullable<PlanningDraft["committed"]>;

function Planner({
  publicCase,
  initialDraft,
  submit,
  revealEvents,
  persist,
}: {
  publicCase: PublicBacklogCase;
  initialDraft: PlanningDraft;
  submit: SubmitAttempt;
  revealEvents: RevealEvents;
  persist: boolean;
}) {
  const messages = getMessages();
  const copy = messages.backlog;
  const [state, dispatch] = useReducer(planningReducer, initialDraft.planning);
  // Set once the first sprint is committed: the sprint has started.
  const [committed, setCommitted] = useState<Committed | undefined>(
    initialDraft.committed,
  );
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "planning" });
  const [isSubmitting, startSubmitting] = useTransition();
  const startedAt = useRef<string | null>(null);
  const router = useRouter();

  const { activeUsers } = publicCase;
  const events = committed?.events;
  const isReplanning = committed !== undefined;
  const tickets = useMemo(
    // Tickets brought by events go first so they are not missed.
    () => [...addedTickets(events ?? []), ...publicCase.tickets],
    [publicCase.tickets, events],
  );
  const newTicketIds = new Set(addedTickets(events ?? []).map((t) => t.id));
  const capacity = capacityAfterEvents(publicCase.sprintCapacity, events ?? []);
  const byId = useMemo(
    () => new Map(tickets.map((ticket) => [ticket.id, ticket])),
    [tickets],
  );

  useEffect(() => {
    startedAt.current ??= new Date().toISOString();
  }, []);

  useEffect(() => {
    if (persist && phase.name !== "done") {
      saveDraft(publicCase.id, {
        planning: state,
        ...(committed ? { committed } : {}),
      });
    }
  }, [persist, phase.name, publicCase.id, state, committed]);

  const sprintSet = new Set(state.sprint);
  const sprintTickets = state.sprint.flatMap((id) => byId.get(id) ?? []);
  const split = splitByCapacity(sprintTickets, capacity);

  const candidates = tickets.filter((ticket) => !(ticket.id in state.marks));
  const setAside = tickets.filter((ticket) => ticket.id in state.marks);
  const filtered = candidates.filter((ticket) =>
    matchesFilters(ticket, filters),
  );
  const filtersActive =
    filters.type !== "all" ||
    filters.requester !== "all" ||
    filters.query.trim() !== "";

  // ------------------------------------------------------------------ drag

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const titleOf = (id: UniqueIdentifier | undefined): string => {
    if (id === undefined) return "";
    if (id === SPRINT_ZONE_ID) return copy.dnd.sprintZone;
    if (id === BACKLOG_ZONE_ID) return copy.dnd.backlogZone;
    const ticketId = ticketIdOf(id);
    const ticket = ticketId ? byId.get(ticketId) : undefined;
    return ticket ? `${ticket.id} ${ticket.title}` : String(id);
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => copy.dnd.pickedUp(titleOf(active.id)),
    onDragOver: ({ active, over }) =>
      over ? copy.dnd.over(titleOf(active.id), titleOf(over.id)) : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? copy.dnd.dropped(titleOf(active.id), titleOf(over.id))
        : copy.dnd.cancelled(titleOf(active.id)),
    onDragCancel: ({ active }) => copy.dnd.cancelled(titleOf(active.id)),
  };

  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveDragId(ticketIdOf(active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    const ticketId = ticketIdOf(active.id);
    if (!over || !ticketId) return;
    const overId = String(over.id);
    const fromSprint = String(active.id) === sprintDragId(ticketId);
    const overTicketId = ticketIdOf(over.id);
    const overSprintIndex =
      overTicketId && overId === sprintDragId(overTicketId)
        ? state.sprint.indexOf(overTicketId)
        : -1;

    if (fromSprint) {
      if (overSprintIndex >= 0) {
        const from = state.sprint.indexOf(ticketId);
        if (from !== overSprintIndex) {
          dispatch({
            type: "set_sprint",
            ids: arrayMove(state.sprint, from, overSprintIndex),
          });
        }
      } else if (overId !== SPRINT_ZONE_ID) {
        // Dropped back on the backlog.
        dispatch({ type: "remove_from_sprint", id: ticketId });
      }
      return;
    }
    if (overSprintIndex >= 0) {
      dispatch({ type: "add_to_sprint", id: ticketId, index: overSprintIndex });
    } else if (overId === SPRINT_ZONE_ID) {
      dispatch({ type: "add_to_sprint", id: ticketId });
    }
  };

  const draggedTicket = activeDragId ? byId.get(activeDragId) : undefined;

  // -------------------------------------------------------------- methods

  const riceRanking = rankByRice(candidates, state.rice, activeUsers);
  const moscowOrder = orderByMoscow(candidates, state.moscow);

  const buildFromRice = () =>
    dispatch({
      type: "set_sprint",
      ids: fillSprint(
        riceRanking.map((entry) => entry.ticket),
        capacity,
      ),
    });
  const buildFromMoscow = () =>
    dispatch({ type: "set_sprint", ids: fillSprint(moscowOrder, capacity) });

  // --------------------------------------------------------------- submit

  const answer: BacklogAnswer = committed
    ? {
        method: state.method,
        sprintTicketIds: committed.sprint,
        replanTicketIds: state.sprint,
        marks: state.marks,
      }
    : {
        method: state.method,
        sprintTicketIds: state.sprint,
        marks: state.marks,
      };

  /** First commit: the sprint starts and the mid-sprint events happen. */
  const startSprint = () => {
    startSubmitting(async () => {
      let outcome: RevealEventsOutcome;
      try {
        outcome = await revealEvents({
          caseId: publicCase.id,
          sprintTicketIds: state.sprint,
        });
      } catch {
        setPhase({ name: "confirming", error: copy.commit.failed });
        return;
      }
      if (!outcome.ok) {
        setPhase({ name: "confirming", error: copy.commit.failed });
        return;
      }
      setCommitted({ sprint: state.sprint, events: outcome.events });
      setPhase({ name: "event" });
    });
  };

  /** Second commit: the replanned sprint is scored on the server. */
  const finish = () => {
    startSubmitting(async () => {
      let outcome: SubmissionOutcome;
      try {
        outcome = await submit({ caseId: publicCase.id, answer });
      } catch {
        setPhase({ name: "confirming", error: copy.commit.failed });
        return;
      }
      if (!outcome.ok) {
        setPhase({ name: "confirming", error: outcome.error.message });
        return;
      }
      const submittedAt = new Date().toISOString();
      const attemptId = crypto.randomUUID();
      try {
        await getAttemptStore().saveAttempt({
          schemaVersion: 1,
          id: attemptId,
          caseId: publicCase.id,
          moduleId: publicCase.moduleId,
          startedAt: startedAt.current ?? submittedAt,
          submittedAt,
          answer,
          result: outcome.result,
        });
      } catch {
        // Without storage there is no results page to open: show the score here.
        clearDraft(publicCase.id);
        setPhase({ name: "done", result: outcome.result });
        return;
      }
      clearDraft(publicCase.id);
      notifyAttemptsChanged();
      router.push(`/results/${attemptId}`);
    });
  };

  useMission(
    phase.name === "done"
      ? null
      : {
          objectives: [
            {
              id: "fill",
              label: copy.mission.fill,
              done: state.sprint.length > 0,
            },
            {
              id: "capacity",
              label: copy.mission.capacity,
              done: state.sprint.length > 0 && split.overCapacityBy === 0,
            },
            {
              id: "commit",
              label: copy.mission.commit,
              done: committed !== undefined,
            },
            { id: "replan", label: copy.mission.replan, done: false },
          ],
          action: {
            label: isReplanning
              ? copy.sprint.confirmReplan
              : copy.sprint.commit,
            disabled: state.sprint.length === 0 || isSubmitting,
            hint: copy.mission.hint,
            onClick: () => setPhase({ name: "confirming" }),
          },
        },
  );

  if (phase.name === "done") {
    return (
      <SprintResult
        result={phase.result}
        moduleId={publicCase.moduleId}
        onPlanAgain={() => {
          startedAt.current = new Date().toISOString();
          dispatch({ type: "reset" });
          setCommitted(undefined);
          setPhase({ name: "planning" });
        }}
      />
    );
  }

  // ------------------------------------------------------------------ view

  const openTicket = openTicketId ? (byId.get(openTicketId) ?? null) : null;

  const renderRow = (ticket: PublicTicket, method: PlanningMethod) => (
    <TicketRow
      key={ticket.id}
      ticket={ticket}
      inSprint={sprintSet.has(ticket.id)}
      isNew={newTicketIds.has(ticket.id)}
      mark={state.marks[ticket.id]}
      draggable
      onOpen={() => setOpenTicketId(ticket.id)}
      onAdd={() => dispatch({ type: "add_to_sprint", id: ticket.id })}
    >
      {method === "rice" && (
        <RiceControls
          ticketId={ticket.id}
          input={state.rice[ticket.id]}
          score={riceScore(state.rice[ticket.id], ticket.effort, activeUsers)}
          onChange={(input) =>
            dispatch({ type: "set_rice", id: ticket.id, input })
          }
        />
      )}
      {method === "moscow" && (
        <MoscowControls
          ticketId={ticket.id}
          bucket={state.moscow[ticket.id]}
          onChange={(bucket) =>
            dispatch({ type: "set_moscow", id: ticket.id, bucket })
          }
        />
      )}
    </TicketRow>
  );

  let backlogBody: React.ReactNode;
  if (state.method === "drag") {
    const rows = filtered.filter((ticket) => !sprintSet.has(ticket.id));
    backlogBody = (
      <ul className="divide-y">{rows.map((t) => renderRow(t, "drag"))}</ul>
    );
  } else if (state.method === "rice") {
    const scores = new Map(
      riceRanking.map((entry) => [entry.ticket.id, entry.score]),
    );
    // Scored tickets by score, then the rest in backlog order.
    const rows = [
      ...riceRanking
        .map((entry) => entry.ticket)
        .filter((t) => matchesFilters(t, filters)),
      ...filtered.filter((t) => !scores.has(t.id)),
    ];
    backlogBody = (
      <ul className="divide-y">{rows.map((t) => renderRow(t, "rice"))}</ul>
    );
  } else {
    const groups: { key: MoscowBucket | "unsorted"; rows: PublicTicket[] }[] = [
      {
        key: "unsorted",
        rows: filtered.filter((t) => state.moscow[t.id] === undefined),
      },
      ...MOSCOW_BUCKETS.map((bucket) => ({
        key: bucket,
        rows: filtered.filter((t) => state.moscow[t.id] === bucket),
      })),
    ];
    backlogBody = groups
      .filter((group) => group.rows.length > 0)
      .map((group) => (
        <div key={group.key}>
          <h3 className="bg-muted/50 text-muted-foreground border-y px-3 py-1.5 text-xs font-medium first:border-t-0">
            {group.key === "unsorted"
              ? copy.moscow.unsorted
              : copy.moscow.buckets[group.key]}
            <span className="ml-1.5 tabular-nums">{group.rows.length}</span>
          </h3>
          <ul className="divide-y">
            {group.rows.map((t) => renderRow(t, "moscow"))}
          </ul>
        </div>
      ));
  }

  const scoredCount = riceRanking.length;
  const bucketedCount = moscowOrder.length;
  const shownCount =
    state.method === "drag"
      ? filtered.filter((t) => !sprintSet.has(t.id)).length
      : filtered.length;
  const totalCount =
    state.method === "drag"
      ? candidates.filter((t) => !sprintSet.has(t.id)).length
      : candidates.length;

  return (
    <DndContext
      // A fixed id keeps dnd-kit's accessibility ids equal on server and client.
      id={`backlog-${publicCase.id}`}
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDragId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: copy.dnd.instructions },
      }}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {events && (
          <section
            aria-labelledby="event-banner-title"
            className="border-warning bg-warning/10 shadow-pixel animate-pixel-pop rounded-md border-2 p-4 lg:col-span-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="event-banner-title"
                className="font-pixel text-warning text-sm tracking-wide uppercase"
              >
                {copy.events.bannerTitle}
              </h2>
              <p className="font-mono text-xs tabular-nums">
                {copy.events.bannerCapacity(
                  publicCase.sprintCapacity,
                  capacity,
                )}
              </p>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpenTicket={setOpenTicketId}
                />
              ))}
            </div>
          </section>
        )}

        <Panel
          flat
          id="backlog-title"
          icon="list"
          title={copy.backlogTitle}
          className="min-w-0"
          bodyClassName="space-y-3"
          subtitle={copy.methods.hints[state.method]}
          aside={
            <SegmentedControl
              label={copy.methods.label}
              value={state.method}
              onValueChange={(method) =>
                dispatch({ type: "set_method", method })
              }
              options={PLANNING_METHODS.map((method) => ({
                value: method,
                label: copy.methods.names[method],
              }))}
            />
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label={copy.filters.search}
                placeholder={copy.filters.searchPlaceholder}
                className="pl-8"
                value={filters.query}
                onChange={(event) =>
                  setFilters({ ...filters, query: event.target.value })
                }
              />
            </div>
            <NativeSelect
              wrapperClassName="w-auto"
              aria-label={copy.filters.type}
              value={filters.type}
              onChange={(event) => {
                const type = TICKET_TYPES.find((t) => t === event.target.value);
                setFilters({ ...filters, type: type ?? "all" });
              }}
            >
              <option value="all">{copy.filters.allTypes}</option>
              {TICKET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {copy.types[type]}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              wrapperClassName="w-auto"
              aria-label={copy.filters.requester}
              value={filters.requester}
              onChange={(event) =>
                setFilters({ ...filters, requester: event.target.value })
              }
            >
              <option value="all">{copy.filters.allRequesters}</option>
              {publicCase.stakeholders.map((stakeholder) => (
                <option key={stakeholder.id} value={stakeholder.id}>
                  {stakeholder.name} · {stakeholder.role}
                </option>
              ))}
            </NativeSelect>
            {filtersActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFilters(NO_FILTERS)}
              >
                <X aria-hidden="true" />
                {copy.filters.clear}
              </Button>
            )}
          </div>

          {state.method !== "drag" && (
            <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <p className="text-muted-foreground text-xs">
                {state.method === "rice"
                  ? copy.rice.buildHint(scoredCount)
                  : copy.moscow.buildHint(bucketedCount)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={
                  state.method === "rice"
                    ? scoredCount === 0
                    : bucketedCount === 0
                }
                onClick={
                  state.method === "rice" ? buildFromRice : buildFromMoscow
                }
              >
                {state.method === "rice" ? copy.rice.build : copy.moscow.build}
              </Button>
            </div>
          )}

          <BacklogDropZone isDragging={activeDragId !== null}>
            <p
              aria-live="polite"
              className="text-muted-foreground bg-muted/30 border-b px-3 py-1.5 text-xs"
            >
              {copy.filters.showing(shownCount, totalCount)}
            </p>
            {backlogBody}
          </BacklogDropZone>

          <section
            aria-labelledby="set-aside-title"
            className="border-border border-t-2 pt-3"
          >
            <h3
              id="set-aside-title"
              className="font-pixel text-ink text-xs tracking-wide uppercase"
            >
              {copy.setAside.title}
              <span className="ml-1.5 tabular-nums">{setAside.length}</span>
            </h3>
            {setAside.length === 0 ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {copy.setAside.empty}
              </p>
            ) : (
              <ul className="pixel-frame mt-2 divide-y">
                {setAside.map((ticket) => {
                  const mark = state.marks[ticket.id];
                  return (
                    <li
                      key={ticket.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <TicketTypeIcon type={ticket.type} className="size-3.5" />
                      <button
                        type="button"
                        onClick={() => setOpenTicketId(ticket.id)}
                        className="focus-visible:ring-ring/50 min-w-0 flex-1 truncate rounded-md text-left focus-visible:ring-3 focus-visible:outline-none"
                      >
                        <span className="text-muted-foreground mr-2 font-mono text-xs">
                          {ticket.id}
                        </span>
                        {ticket.title}
                      </button>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {mark.kind === "duplicate"
                          ? copy.setAside.duplicateBadge(mark.duplicateOfId)
                          : copy.discardReasons[mark.reason]}
                      </span>
                      <EffortPill effort={ticket.effort} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Panel>

        <SprintPanel
          tickets={sprintTickets}
          capacity={capacity}
          split={split}
          onOpen={setOpenTicketId}
          onMove={(id, toIndex) =>
            dispatch({ type: "move_in_sprint", id, toIndex })
          }
          onRemove={(id) => dispatch({ type: "remove_from_sprint", id })}
          onClear={() => dispatch({ type: "clear_sprint" })}
          note={
            committed
              ? copy.events.changes(
                  state.sprint.filter((id) => !committed.sprint.includes(id))
                    .length,
                  committed.sprint.filter((id) => !state.sprint.includes(id))
                    .length,
                )
              : undefined
          }
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedTicket && (
          <div className="bg-card flex w-80 items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg">
            <TicketTypeIcon type={draggedTicket.type} className="size-3.5" />
            <span className="min-w-0 flex-1 truncate">
              {draggedTicket.title}
            </span>
            <EffortPill effort={draggedTicket.effort} />
          </div>
        )}
      </DragOverlay>

      <TicketSheet
        ticket={openTicket}
        allTickets={tickets}
        stakeholders={publicCase.stakeholders}
        inSprint={openTicket ? sprintSet.has(openTicket.id) : false}
        mark={openTicket ? state.marks[openTicket.id] : undefined}
        onClose={() => setOpenTicketId(null)}
        onAdd={() =>
          openTicket && dispatch({ type: "add_to_sprint", id: openTicket.id })
        }
        onRemove={() =>
          openTicket &&
          dispatch({ type: "remove_from_sprint", id: openTicket.id })
        }
        onMark={(mark) =>
          openTicket && dispatch({ type: "mark", id: openTicket.id, mark })
        }
        onUnmark={() =>
          openTicket && dispatch({ type: "unmark", id: openTicket.id })
        }
      />

      <Dialog
        open={phase.name === "confirming"}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setPhase({ name: "planning" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isReplanning ? copy.commit.replanTitle : copy.commit.title}
            </DialogTitle>
            <DialogDescription>
              {(isReplanning ? copy.commit.replanBody : copy.commit.body)(
                sprintTickets.length,
                split.plannedEffort,
                capacity,
              )}
            </DialogDescription>
          </DialogHeader>
          {split.overCapacityBy > 0 && (
            <p className="text-destructive text-sm font-medium">
              {copy.commit.overWarning(split.overCapacityBy)}
            </p>
          )}
          {phase.name === "confirming" && phase.error && (
            <p role="alert" className="text-destructive text-sm">
              {phase.error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setPhase({ name: "planning" })}
            >
              {copy.commit.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={isReplanning ? finish : startSprint}
            >
              {isSubmitting
                ? isReplanning
                  ? copy.commit.submitting
                  : copy.commit.revealing
                : copy.commit.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={phase.name === "event" && events !== undefined}
        onOpenChange={(open) => {
          if (!open) setPhase({ name: "planning" });
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {copy.events.dialogTitle(events?.length ?? 1)}
            </DialogTitle>
            <DialogDescription>{copy.events.dialogBody}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {events?.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setPhase({ name: "planning" })}
            >
              {copy.events.replan}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
