import { getMessages } from "@/i18n";

import type { PublicQuickCase } from "../schema";

/** The exhibits of a quick case: short notes and small tables. */
export function Exhibits({
  exhibits,
}: {
  exhibits: PublicQuickCase["exhibits"];
}) {
  const copy = getMessages().quick.brief;
  return (
    <section aria-labelledby="exhibits-title" className="space-y-3">
      <h2
        id="exhibits-title"
        className="font-pixel text-ink text-xs tracking-wide uppercase"
      >
        {copy.exhibits}
      </h2>
      {exhibits.map((exhibit) => (
        <article key={exhibit.id} className="bg-card rounded-lg border p-3">
          <h3 className="text-sm font-semibold">{exhibit.title}</h3>
          <p className="text-muted-foreground text-xs">
            {copy.source(exhibit.source)}
          </p>
          {exhibit.body && (
            <p className="mt-2 text-sm leading-relaxed">{exhibit.body}</p>
          )}
          {exhibit.rows && (
            <dl className="mt-2 divide-y text-sm">
              {exhibit.rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.5"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-[0.8125rem] font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      ))}
    </section>
  );
}
