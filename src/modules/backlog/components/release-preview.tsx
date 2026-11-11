"use client";

/**
 * The next release as users would read it, from the sprint as planned:
 * features and fixes they will notice, the tech debt they will not, and
 * what does not fit in the sprint.
 */
import { AppBar, Placeholder } from "@/components/phone/phone-frame";
import { getMessages } from "@/i18n";

import type { PublicTicket } from "../schema";

const NEW_TYPES = new Set(["feature", "sales_request", "ceo_request"]);

export function ReleasePreview({
  company,
  tickets,
  spilledIds,
}: {
  company: string;
  tickets: readonly PublicTicket[];
  spilledIds: readonly string[];
}) {
  const copy = getMessages().preview.backlog;
  const spilled = new Set(spilledIds);
  const shipping = tickets.filter((t) => !spilled.has(t.id));
  const added = shipping.filter((t) => NEW_TYPES.has(t.type));
  const fixed = shipping.filter((t) => t.type === "bug");
  const debt = shipping.filter((t) => t.type === "tech_debt").length;
  const late = tickets.filter((t) => spilled.has(t.id));

  return (
    <>
      <AppBar company={company} title={copy.screen} />
      <div className="space-y-3 p-4">
        {shipping.length === 0 && (
          <p className="text-xs">
            <Placeholder>{copy.empty}</Placeholder>
          </p>
        )}
        {added.length > 0 && (
          <section>
            <p className="text-xs font-semibold">{copy.added}</p>
            <ul className="mt-1.5 space-y-1.5">
              {added.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex gap-2 rounded-lg p-2 text-xs"
                  style={{ background: "var(--app-tint)" }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 rounded px-1 text-[0.625rem] font-bold text-white"
                    style={{ background: "var(--app-accent)" }}
                  >
                    {copy.newBadge}
                  </span>
                  {ticket.title}
                </li>
              ))}
            </ul>
          </section>
        )}
        {fixed.length > 0 && (
          <section>
            <p className="text-xs font-semibold">{copy.fixed}</p>
            <ul className="mt-1 space-y-1 text-xs text-zinc-700">
              {fixed.map((ticket) => (
                <li key={ticket.id} className="flex gap-1.5">
                  <span aria-hidden="true">✓</span>
                  {ticket.title}
                </li>
              ))}
            </ul>
          </section>
        )}
        {debt > 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-2 text-[0.6875rem] text-zinc-600">
            {copy.underTheHood(debt)}
          </p>
        )}
        {late.length > 0 && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-2">
            <p className="text-xs font-semibold text-red-800">
              {copy.late(late.length)}
            </p>
            <ul className="mt-1 space-y-0.5 text-[0.6875rem] text-red-800">
              {late.map((ticket) => (
                <li key={ticket.id}>· {ticket.title}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
