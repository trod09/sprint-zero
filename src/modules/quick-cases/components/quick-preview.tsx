"use client";

/**
 * What customers would see if the learner's choices shipped: a paywall, a
 * store listing, a push and a status page, or an email to the CEO. Built
 * only from the learner's choices and words, never from ratings.
 */
import {
  Placeholder,
  PushNotification,
  AppBar,
} from "@/components/phone/phone-frame";
import { getMessages } from "@/i18n";

import type { PublicQuickCase } from "../schema";

const unquote = (text: string) => text.replace(/^["“]|["”]$/g, "");

export function QuickPreview({
  publicCase,
  choices,
  writing,
}: {
  publicCase: PublicQuickCase;
  choices: Record<string, string[]>;
  writing: string;
}) {
  const copy = getMessages().preview.quick;
  const company = publicCase.company.name;
  const chosen = (stepId: string) => {
    const step = publicCase.steps.find((s) => s.id === stepId);
    return (choices[stepId] ?? []).flatMap((id) => {
      const option = step?.options.find((o) => o.id === id);
      return option ? [{ id, text: option.text }] : [];
    });
  };
  const words = writing.trim();

  switch (publicCase.kind) {
    case "pricing": {
      const price = chosen("price")[0];
      const amount = price?.text.match(/\$\d+/)?.[0];
      const scale = chosen("metric")[0];
      const rollout = chosen("rollout");
      return (
        <>
          <AppBar company={company} title={copy.pricing.screen} />
          <div className="space-y-3 p-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--app-tint)" }}
            >
              <p className="text-[0.6875rem] font-semibold text-zinc-700 uppercase">
                {copy.pricing.plan(company)}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {amount ?? <Placeholder>$?</Placeholder>}
                <span className="text-sm font-medium text-zinc-600">
                  {" "}
                  {copy.pricing.perMonth}
                </span>
              </p>
              {scale && (
                <p className="mt-1 text-xs text-zinc-700">
                  {copy.pricing.next(scale.text)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="font-semibold">{copy.pricing.announcement}</p>
              <p className="mt-1 text-zinc-700">
                {words || <Placeholder>{copy.pricing.writeIt}</Placeholder>}
              </p>
              {rollout.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-zinc-700">
                  {rollout.map((r) => (
                    <li key={r.id} className="flex gap-1.5">
                      <span aria-hidden="true">✓</span>
                      {r.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="w-full rounded-lg py-2 text-sm font-semibold text-white"
              style={{ background: "var(--app-accent)" }}
            >
              {copy.pricing.cta}
            </button>
          </div>
        </>
      );
    }
    case "go_to_market": {
      const segment = chosen("segment")[0];
      const channels = chosen("channels");
      return (
        <div className="space-y-3 p-4">
          <p className="text-[0.6875rem] font-semibold text-zinc-600 uppercase">
            {copy.launch.store}
          </p>
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ background: "var(--app-accent)" }}
            >
              {company.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{company}</p>
              <p className="text-xs text-zinc-700">
                {words || <Placeholder>{copy.launch.writeIt}</Placeholder>}
              </p>
              <span
                aria-hidden="true"
                className="mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ background: "var(--app-accent)" }}
              >
                {copy.launch.get}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl"
                style={{ background: "var(--app-tint)" }}
              />
            ))}
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{copy.launch.madeFor}</p>
            <p className="text-zinc-700">
              {segment?.text ?? <Placeholder>{copy.launch.pick}</Placeholder>}
            </p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{copy.launch.where}</p>
            {channels.length === 0 ? (
              <Placeholder>{copy.launch.pick}</Placeholder>
            ) : (
              <ul className="space-y-1 text-zinc-700">
                {channels.map((c) => (
                  <li key={c.id}>· {c.text}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }
    case "incident": {
      const message = chosen("message")[0];
      const move = chosen("first_move")[0];
      return (
        <div
          className="flex h-full flex-col gap-3 p-4"
          style={{
            background:
              "linear-gradient(to bottom, var(--app-tint), #ffffff 60%)",
          }}
        >
          <p className="pt-2 text-center text-4xl font-light tracking-tight">
            10:21
          </p>
          <PushNotification
            app={company}
            title={copy.incident.push}
            body={
              message ? (
                unquote(message.text)
              ) : (
                <Placeholder>{copy.incident.pickMessage}</Placeholder>
              )
            }
          />
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="text-[0.6875rem] text-zinc-600">
              {copy.incident.status(company)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-amber-500"
              />
              {copy.incident.investigating}
            </p>
            <p className="mt-1 text-xs text-zinc-700">
              {words || <Placeholder>{copy.incident.writeIt}</Placeholder>}
            </p>
            {move && (
              <p className="mt-2 border-t border-zinc-200 pt-2 text-xs text-zinc-700">
                <span className="font-semibold">{copy.incident.action}: </span>
                {move.text}
              </p>
            )}
          </div>
        </div>
      );
    }
    default: {
      const decision = chosen("decision")[0];
      return (
        <>
          <AppBar company={copy.mail.app} title={copy.mail.newMessage} />
          <div className="space-y-2 p-4 text-xs">
            <p className="border-b border-zinc-200 pb-1.5">
              <span className="text-zinc-600">{copy.mail.to} </span>
              {copy.mail.ceo(company)}
            </p>
            <p className="border-b border-zinc-200 pb-1.5">
              <span className="text-zinc-600">{copy.mail.subject} </span>
              {publicCase.title}
            </p>
            <p className="pt-1 text-[0.8125rem] font-semibold">
              {decision?.text ?? <Placeholder>{copy.mail.pick}</Placeholder>}
            </p>
            <p className="text-[0.8125rem] text-zinc-700">
              {words || <Placeholder>{copy.mail.writeIt}</Placeholder>}
            </p>
          </div>
        </>
      );
    }
  }
}
