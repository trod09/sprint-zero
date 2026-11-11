"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";

import { ScoreBreakdown } from "@/components/score-breakdown";
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
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getMessages } from "@/i18n";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";

import {
  boardReducer,
  boardSchema,
  boardToAnswer,
  emptyBoard,
  NOISE,
  placements,
  sanitizeBoard,
  UNSORTED,
  type Board,
  type Target,
} from "../board";
import {
  MAX_CLUSTERS,
  SOURCES,
  type FeedbackItem,
  type PublicFeedbackTriageCase,
  type Source,
} from "../schema";
import { ClusterCard, NoiseBin, targetOfZone } from "./cluster-card";
import { FeedbackCard, ItemMeta, itemIdOfDrag } from "./feedback-card";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/arcade/empty-state";
import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";

export type { SubmitAttempt };

// ------------------------------------------------------------------- draft

const draftKey = (caseId: string) =>
  `sprint-zero:feedback-triage-draft:v1:${caseId}`;

function loadBoard(publicCase: PublicFeedbackTriageCase): Board {
  try {
    const raw = window.localStorage.getItem(draftKey(publicCase.id));
    if (!raw) return emptyBoard();
    const parsed = boardSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? sanitizeBoard(
          parsed.data,
          publicCase.items.map((item) => item.id),
        )
      : emptyBoard();
  } catch {
    return emptyBoard();
  }
}

function saveBoard(caseId: string, board: Board): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(board));
  } catch {
    // Storage full or disabled: the triage still works for this visit.
  }
}

function clearBoard(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}

/** Only what is under the pointer counts; keyboard drags go to the nearest zone. */
const collisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);

type Show = "unsorted" | "all";
type Order = "newest" | "oldest";

// -------------------------------------------------------------- component

export function TriageWorkspace(props: {
  publicCase: PublicFeedbackTriageCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const board = useMemo(
    () => (isClient ? loadBoard(props.publicCase) : emptyBoard()),
    [isClient, props.publicCase],
  );
  return (
    <Workspace
      key={isClient ? "client" : "server"}
      {...props}
      initialBoard={board}
      persist={isClient}
    />
  );
}

function Workspace({
  publicCase,
  submit,
  initialBoard,
  persist,
}: {
  publicCase: PublicFeedbackTriageCase;
  submit: SubmitAttempt;
  initialBoard: Board;
  persist: boolean;
}) {
  const copy = getMessages().triage;
  const [board, dispatch] = useReducer(boardReducer, initialBoard);
  const [show, setShow] = useState<Show>("unsorted");
  const [source, setSource] = useState<Source | "all">("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTarget, setBulkTarget] = useState<Target>(UNSORTED);
  const [newName, setNewName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.submit.failed,
      onSubmitted: () => clearBoard(publicCase.id),
    });

  useEffect(() => {
    if (persist) saveBoard(publicCase.id, board);
  }, [persist, publicCase.id, board]);

  const byId = useMemo(
    () => new Map(publicCase.items.map((item) => [item.id, item])),
    [publicCase.items],
  );
  const where = useMemo(() => placements(board), [board]);
  const targetOf = (id: string): Target => where.get(id) ?? UNSORTED;
  const unsortedCount = publicCase.items.filter((i) => !where.has(i.id)).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = publicCase.items.filter(
      (item) =>
        (show === "all" || !where.has(item.id)) &&
        (source === "all" || item.source === source) &&
        (!needle ||
          item.text.toLowerCase().includes(needle) ||
          item.id.toLowerCase().includes(needle)),
    );
    // Items come oldest first.
    return order === "newest" ? [...list].reverse() : list;
  }, [publicCase.items, show, source, query, order, where]);

  const itemsOf = (ids: readonly string[]): FeedbackItem[] =>
    ids.map((id) => byId.get(id)).filter((i): i is FeedbackItem => !!i);

  const move = (itemIds: readonly string[], target: Target) => {
    dispatch({ type: "move_items", itemIds, target });
    setSelected((current) => current.filter((id) => !itemIds.includes(id)));
  };

  const createCluster = (withSelection: boolean) => {
    const name = newName.trim();
    if (!name) return;
    dispatch({
      type: "create",
      name,
      itemIds: withSelection ? selected : undefined,
    });
    if (withSelection) setSelected([]);
    setNewName("");
  };

  // ------------------------------------------------------------------ drag

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const nameOf = (id: UniqueIdentifier | undefined): string => {
    if (id === undefined) return "";
    const value = String(id);
    const itemId = itemIdOfDrag(value);
    if (itemId) return itemId;
    const target = targetOfZone(value);
    if (target === NOISE) return copy.clusters.noise;
    return board.clusters.find((c) => c.id === target)?.name ?? value;
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => copy.dnd.pickedUp(nameOf(active.id)),
    onDragOver: ({ active, over }) =>
      over ? copy.dnd.over(nameOf(active.id), nameOf(over.id)) : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? copy.dnd.dropped(nameOf(active.id), nameOf(over.id))
        : copy.dnd.cancelled(nameOf(active.id)),
    onDragCancel: ({ active }) => copy.dnd.cancelled(nameOf(active.id)),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const itemId = itemIdOfDrag(String(active.id));
    const target = over ? targetOfZone(String(over.id)) : null;
    if (!itemId || !target) return;
    // Dragging a selected item moves the whole selection.
    move(selected.includes(itemId) ? selected : [itemId], target);
  };

  // ---------------------------------------------------------------- submit

  const answer = boardToAnswer(board);
  const filled = board.clusters.filter((c) => c.itemIds.length > 0);

  useMission(
    inlineResult
      ? null
      : {
          objectives: [
            {
              id: "themes",
              label: copy.mission.themes,
              done: filled.length >= 2,
            },
            {
              id: "sort",
              label: copy.mission.sort,
              done: unsortedCount === 0,
            },
            {
              id: "critical",
              label: copy.mission.critical,
              done: filled.some((c) => c.id === board.criticalClusterId),
            },
            {
              id: "opportunities",
              label: copy.mission.opportunities,
              done:
                filled.length > 0 &&
                filled.every((c) => c.opportunity.trim() !== ""),
            },
          ],
          action: {
            label: copy.submit.button,
            disabled: !answer,
            hint: copy.submit.needsCluster,
            onClick: () => {
              clearError();
              setConfirming(true);
            },
          },
        },
  );

  if (inlineResult) {
    return (
      <section className="pixel-card p-6">
        <p className="font-heading text-5xl font-semibold tabular-nums">
          {inlineResult.total}
          <span className="text-muted-foreground text-lg"> / 100</span>
        </p>
        <div className="mt-6">
          <ScoreBreakdown criteria={inlineResult.criteria} />
        </div>
      </section>
    );
  }

  const activeItem = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      // A fixed id keeps dnd-kit's accessibility ids equal on server and client.
      id={`triage-${publicCase.id}`}
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => setActiveId(itemIdOfDrag(String(active.id)))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: copy.dnd.instructions },
      }}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          flat
          id="inbox-title"
          icon="chat"
          title={copy.inbox.title}
          className="min-w-0"
          bodyClassName="space-y-3"
          aside={
            <SegmentedControl<Show>
              label={copy.inbox.show}
              value={show}
              onValueChange={setShow}
              options={[
                {
                  value: "unsorted",
                  label: copy.inbox.unsorted(unsortedCount),
                },
                {
                  value: "all",
                  label: copy.inbox.all(publicCase.items.length),
                },
              ]}
            />
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              aria-label={copy.inbox.search}
              placeholder={copy.inbox.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8 w-48"
            />
            <NativeSelect
              wrapperClassName="w-auto"
              aria-label={copy.inbox.allSources}
              value={source}
              onChange={(event) =>
                setSource(event.target.value as Source | "all")
              }
            >
              <option value="all">{copy.inbox.allSources}</option>
              {SOURCES.map((value) => (
                <option key={value} value={value}>
                  {copy.sources[value]}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              wrapperClassName="w-auto"
              aria-label={copy.inbox.order}
              value={order}
              onChange={(event) => setOrder(event.target.value as Order)}
            >
              <option value="newest">{copy.inbox.newestFirst}</option>
              <option value="oldest">{copy.inbox.oldestFirst}</option>
            </NativeSelect>
          </div>

          {selected.length > 0 && (
            <div
              role="region"
              aria-label={copy.inbox.selected(selected.length)}
              className="bg-brand/5 border-brand/30 sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm backdrop-blur"
            >
              <span className="font-medium">
                {copy.inbox.selected(selected.length)}
              </span>
              <Label htmlFor="bulk-target" className="sr-only">
                {copy.inbox.moveSelected}
              </Label>
              <NativeSelect
                id="bulk-target"
                value={bulkTarget}
                onChange={(event) => setBulkTarget(event.target.value)}
              >
                <option value={UNSORTED}>{copy.inbox.unsortedOption}</option>
                {board.clusters.map((cluster) => (
                  <option key={cluster.id} value={cluster.id}>
                    {cluster.name || "Untitled"}
                  </option>
                ))}
                <option value={NOISE}>{copy.inbox.noiseOption}</option>
              </NativeSelect>
              <Button
                type="button"
                size="sm"
                onClick={() => move(selected, bulkTarget)}
              >
                {copy.inbox.move}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelected([])}
              >
                {copy.inbox.clearSelection}
              </Button>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState
              title={
                show === "unsorted" && unsortedCount === 0
                  ? copy.inbox.allSortedTitle
                  : copy.inbox.emptyTitle
              }
            >
              {show === "unsorted" && unsortedCount === 0
                ? copy.inbox.allSorted
                : copy.inbox.empty}
            </EmptyState>
          ) : (
            <ul className="border-border divide-y overflow-hidden rounded-md border-2">
              {visible.map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={item}
                  target={targetOf(item.id)}
                  clusters={board.clusters}
                  selected={selected.includes(item.id)}
                  onSelect={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                  onMove={(target) => move([item.id], target)}
                />
              ))}
            </ul>
          )}
        </Panel>

        <aside
          aria-label={copy.clusters.title}
          tabIndex={0}
          className="focus-visible:ring-ring/50 space-y-3 rounded-md focus-visible:ring-3 focus-visible:outline-none lg:sticky lg:top-20 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
        >
          <Panel
            id="clusters-title"
            icon="list"
            title={copy.clusters.title}
            subtitle={copy.clusters.intro}
            aside={`${board.clusters.length}/${MAX_CLUSTERS}`}
            bodyClassName="space-y-3 p-3"
          >
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                createCluster(false);
              }}
            >
              <Input
                aria-label={copy.clusters.newName}
                placeholder={copy.clusters.newPlaceholder}
                value={newName}
                maxLength={60}
                onChange={(event) => setNewName(event.target.value)}
                disabled={board.clusters.length >= MAX_CLUSTERS}
                className="h-8"
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  !newName.trim() || board.clusters.length >= MAX_CLUSTERS
                }
              >
                <Plus aria-hidden="true" />
                {copy.clusters.add}
              </Button>
            </form>
            {selected.length > 0 && newName.trim() && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => createCluster(true)}
              >
                {copy.inbox.newClusterFromSelection}
              </Button>
            )}
            {board.clusters.length >= MAX_CLUSTERS && (
              <p className="text-muted-foreground text-xs">
                {copy.clusters.full(MAX_CLUSTERS)}
              </p>
            )}
            {board.clusters.length === 0 ? (
              <EmptyState size="sm" title={copy.clusters.emptyTitle}>
                {copy.clusters.empty}
              </EmptyState>
            ) : (
              <ol className="space-y-2">
                {board.clusters.map((cluster, index) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    position={index + 1}
                    total={board.clusters.length}
                    items={itemsOf(cluster.itemIds)}
                    critical={board.criticalClusterId === cluster.id}
                    dragging={activeId !== null}
                    onRename={(name) =>
                      dispatch({ type: "rename", clusterId: cluster.id, name })
                    }
                    onMove={(delta) =>
                      dispatch({
                        type: "move_cluster",
                        clusterId: cluster.id,
                        delta,
                      })
                    }
                    onRemove={() =>
                      dispatch({ type: "remove", clusterId: cluster.id })
                    }
                    onToggleCritical={() =>
                      dispatch({
                        type: "toggle_critical",
                        clusterId: cluster.id,
                      })
                    }
                    onOpportunity={(text) =>
                      dispatch({
                        type: "set_opportunity",
                        clusterId: cluster.id,
                        text,
                      })
                    }
                    onUnassign={(id) => move([id], UNSORTED)}
                  />
                ))}
              </ol>
            )}
            <NoiseBin
              items={itemsOf(board.noiseItemIds)}
              dragging={activeId !== null}
              onUnassign={(id) => move([id], UNSORTED)}
            />
          </Panel>

          <div className="space-y-2">
            {(board.clusters.length > 0 || board.noiseItemIds.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setSelected([]);
                }}
              >
                <RotateCcw aria-hidden="true" />
                {copy.submit.reset}
              </Button>
            )}
          </div>
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div className="bg-card max-w-md rounded-lg border p-2 shadow-lg">
            <ItemMeta item={activeItem} />
            <p className="mt-1 line-clamp-2 text-sm">{activeItem.text}</p>
            {selected.includes(activeItem.id) && selected.length > 1 && (
              <p className="text-brand mt-1 text-xs">
                {copy.inbox.selected(selected.length)}
              </p>
            )}
          </div>
        )}
      </DragOverlay>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.submit.confirmTitle}</DialogTitle>
            <DialogDescription>{copy.submit.confirmBody}</DialogDescription>
          </DialogHeader>
          {(unsortedCount > 0 || !answer?.criticalClusterId) && (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {unsortedCount > 0 && (
                <li>{copy.submit.unsortedWarning(unsortedCount)}</li>
              )}
              {!answer?.criticalClusterId && <li>{copy.submit.noCritical}</li>}
            </ul>
          )}
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
            >
              {copy.submit.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !answer}
              onClick={() => answer && submitAnswer(answer)}
            >
              {isSubmitting ? copy.submit.submitting : copy.submit.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
