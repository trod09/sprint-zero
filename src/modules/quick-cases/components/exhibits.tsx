import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { PublicQuickCase } from "../schema";

/** The exhibits of a quick case: short notes and small tables, as a dossier. */
export function Exhibits({
  exhibits,
  scroll = false,
}: {
  exhibits: PublicQuickCase["exhibits"];
  /** Scroll inside the panel on wide screens, so it can stay in view. */
  scroll?: boolean;
}) {
  const copy = getMessages().quick.brief;
  return (
    <Panel
      icon="doc"
      title={copy.exhibits}
      aside={exhibits.length}
      bodyClassName={cn(
        "space-y-3",
        scroll &&
          "focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto",
      )}
      bodyProps={
        scroll
          ? { tabIndex: 0, role: "region", "aria-label": copy.exhibits }
          : undefined
      }
    >
      {exhibits.map((exhibit, index) => (
        <article
          key={exhibit.id}
          className="bg-background/60 border-border rounded-md border-2 p-3"
        >
          <p className="font-pixel text-muted-foreground text-[0.625rem] tracking-widest uppercase">
            {copy.exhibitNumber(index + 1)} · {exhibit.source}
          </p>
          <h3 className="mt-1 text-sm font-semibold">{exhibit.title}</h3>
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
    </Panel>
  );
}
