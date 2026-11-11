"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { formatInteger, formatUsd } from "@/lib/format";

import {
  DISCARD_REASONS,
  discardReasonSchema,
  type PublicTicket,
  type Stakeholder,
  type TicketMark,
} from "../schema";
import { EffortPill, TicketTypeIcon } from "./ticket-meta";
import { NativeSelect } from "@/components/ui/native-select";

interface TicketSheetProps {
  ticket: PublicTicket | null;
  /** Every ticket in the backlog, for picking the original of a duplicate. */
  allTickets: readonly PublicTicket[];
  stakeholders: readonly Stakeholder[];
  inSprint: boolean;
  mark?: TicketMark;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onMark: (mark: TicketMark) => void;
  onUnmark: () => void;
}

export function TicketSheet(props: TicketSheetProps) {
  const { ticket, onClose } = props;
  return (
    <Sheet open={ticket !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {/* Keyed so the forms reset when another ticket opens. */}
        {ticket && <TicketDetail key={ticket.id} {...props} ticket={ticket} />}
      </SheetContent>
    </Sheet>
  );
}

function TicketDetail({
  ticket,
  allTickets,
  stakeholders,
  inSprint,
  mark,
  onAdd,
  onRemove,
  onMark,
  onUnmark,
}: TicketSheetProps & { ticket: PublicTicket }) {
  const messages = getMessages();
  const copy = messages.backlog.detail;
  const stakeholder = stakeholders.find((s) => s.id === ticket.stakeholderId);
  const [duplicateOfId, setDuplicateOfId] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const { visible } = ticket;
  const signals = [
    visible.reach !== undefined && {
      label: copy.reach,
      value: copy.reachValue(formatInteger(visible.reach)),
    },
    visible.supportTickets !== undefined && {
      label: copy.supportTickets,
      value: copy.supportValue(visible.supportTickets),
    },
    visible.revenueAtRisk !== undefined && {
      label: copy.revenueAtRisk,
      value: copy.revenueValue(formatUsd(visible.revenueAtRisk)),
    },
  ].filter((entry) => entry !== false);

  const others = allTickets
    .filter((other) => other.id !== ticket.id)
    .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));

  const submitDiscard = () => {
    const parsed = discardReasonSchema.safeParse(reason);
    if (!parsed.success) return;
    const trimmed = note.trim();
    onMark({
      kind: "discard",
      reason: parsed.data,
      ...(trimmed ? { note: trimmed.slice(0, 280) } : {}),
    });
  };

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <TicketTypeIcon type={ticket.type} className="size-3.5" />
          <span>{messages.backlog.types[ticket.type]}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{ticket.id}</span>
        </div>
        <SheetTitle className="text-lg leading-snug">{ticket.title}</SheetTitle>
        <SheetDescription>
          {copy.requestedBy} {ticket.requester}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 p-4">
        <section>
          <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
            {copy.description}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed">{ticket.description}</p>
        </section>

        <section>
          <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
            {copy.signals}
          </h3>
          <dl className="mt-1.5 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{copy.effort}</dt>
              <dd>
                <EffortPill effort={ticket.effort} />
              </dd>
            </div>
            {signals.map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
          {visible.impactHint && (
            <figure className="border-brand/40 bg-muted/40 mt-3 rounded-r-lg border-l-2 px-3 py-2 text-sm">
              <figcaption className="text-muted-foreground text-xs">
                {copy.claim}
              </figcaption>
              <blockquote className="mt-0.5 italic">
                “{visible.impactHint}”
              </blockquote>
            </figure>
          )}
          {signals.length === 0 && !visible.impactHint && (
            <p className="text-muted-foreground mt-2 text-sm">
              {copy.noSignals}
            </p>
          )}
        </section>

        {stakeholder && (
          <section>
            <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
              {copy.priorities(stakeholder.name)}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              {stakeholder.role}
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm">
              {stakeholder.priorities.map((priority) => (
                <li key={priority}>{priority}</li>
              ))}
            </ul>
          </section>
        )}

        {mark ? (
          <section className="bg-muted/50 rounded-lg p-3 text-sm">
            <p>
              {mark.kind === "duplicate"
                ? copy.markedDuplicate(mark.duplicateOfId)
                : copy.markedDiscard(
                    messages.backlog.discardReasons[mark.reason],
                  )}
            </p>
            {mark.kind === "discard" && mark.note && (
              <p className="text-muted-foreground mt-1 italic">“{mark.note}”</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onUnmark}
            >
              {copy.restore}
            </Button>
          </section>
        ) : (
          <>
            <Button
              type="button"
              className="w-full"
              variant={inSprint ? "outline" : "default"}
              onClick={inSprint ? onRemove : onAdd}
            >
              {inSprint ? copy.removeFromSprint : copy.addToSprint}
            </Button>

            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-sm font-medium">{copy.setAsideTitle}</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {copy.setAsideHint}
                </p>
              </div>

              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (duplicateOfId) {
                    onMark({ kind: "duplicate", duplicateOfId });
                  }
                }}
              >
                <Label htmlFor="duplicate-of">{copy.duplicate}</Label>
                <div className="flex gap-2">
                  <NativeSelect
                    id="duplicate-of"
                    value={duplicateOfId}
                    onChange={(event) => setDuplicateOfId(event.target.value)}
                  >
                    <option value="">{copy.duplicatePlaceholder}</option>
                    {others.map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.id} — {other.title}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!duplicateOfId}
                  >
                    {copy.markDuplicate}
                  </Button>
                </div>
              </form>

              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitDiscard();
                }}
              >
                <Label htmlFor="discard-reason">{copy.discardReason}</Label>
                <NativeSelect
                  id="discard-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  <option value="">{copy.discardPlaceholder}</option>
                  {DISCARD_REASONS.map((value) => (
                    <option key={value} value={value}>
                      {messages.backlog.discardReasons[value]}
                    </option>
                  ))}
                </NativeSelect>
                <Label htmlFor="discard-note" className="pt-1">
                  {copy.discardNote}
                </Label>
                <Textarea
                  id="discard-note"
                  value={note}
                  maxLength={280}
                  rows={2}
                  placeholder={copy.discardNotePlaceholder}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button type="submit" variant="outline" disabled={!reason}>
                  {copy.discard}
                </Button>
              </form>
            </section>
          </>
        )}
      </div>
    </>
  );
}
