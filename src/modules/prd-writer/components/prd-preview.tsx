"use client";

/**
 * The feature as customers would meet it: a "What's new" screen built from
 * the learner's problem statement and scope. Version 1 items ship, later
 * items are teased, non-goals stay out of sight.
 */
import { AppBar, Placeholder } from "@/components/phone/phone-frame";
import { getMessages } from "@/i18n";

import type { Bucket, PublicPrdCase } from "../schema";

export function PrdPreview({
  publicCase,
  problem,
  scope,
}: {
  publicCase: PublicPrdCase;
  problem: string;
  scope: Record<string, Bucket>;
}) {
  const copy = getMessages().preview.prd;
  const inBucket = (bucket: Bucket) =>
    publicCase.requirements.filter((r) => scope[r.id] === bucket);
  const v1 = inBucket("v1");
  const later = inBucket("later");
  const out = inBucket("out");

  return (
    <>
      <AppBar company={publicCase.company.name} title={copy.screen} />
      <div className="space-y-3 p-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--app-tint)" }}
        >
          <p className="text-[0.6875rem] font-semibold text-zinc-700 uppercase">
            {copy.new}
          </p>
          <p className="mt-1 text-lg leading-tight font-bold">
            {publicCase.feature}
          </p>
          <p className="mt-1.5 text-xs text-zinc-700">
            {problem.trim() || <Placeholder>{copy.writeProblem}</Placeholder>}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold">{copy.inThisVersion}</p>
          {v1.length === 0 ? (
            <p className="mt-1 text-xs">
              <Placeholder>{copy.pickV1}</Placeholder>
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5">
              {v1.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-2 rounded-lg border border-zinc-200 p-2"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[0.625rem] text-white"
                    style={{ background: "var(--app-accent)" }}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">
                      {item.title}
                    </span>
                    <span className="block text-[0.6875rem] text-zinc-600">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {later.length > 0 && (
          <div>
            <p className="text-xs font-semibold">{copy.comingSoon}</p>
            <ul className="mt-1 space-y-0.5 text-[0.6875rem] text-zinc-600">
              {later.map((item) => (
                <li key={item.id}>· {item.title}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="w-full rounded-lg py-2 text-sm font-semibold text-white"
          style={{ background: "var(--app-accent)" }}
        >
          {copy.tryIt}
        </button>
        {out.length > 0 && (
          <p className="text-center text-[0.6875rem] text-zinc-600">
            {copy.notPlanned(out.length)}
          </p>
        )}
      </div>
    </>
  );
}
