import { Panel } from "@/components/arcade/panel";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

import type { PublicPrdCase } from "../schema";

/** The documents the PRD must be grounded in, always in view. */
export function DocumentsPanel({
  documents,
}: {
  documents: PublicPrdCase["documents"];
}) {
  const copy = getMessages().prd;
  return (
    <Panel
      id="documents-title"
      icon="doc"
      title={copy.brief.documents}
      subtitle={copy.brief.documentsIntro}
      aside={documents.length}
      bodyClassName="focus-visible:ring-ring/50 space-y-3 focus-visible:ring-3 focus-visible:outline-none lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto"
      bodyProps={{
        tabIndex: 0,
        role: "region",
        "aria-label": copy.brief.documents,
      }}
    >
      {documents.map((document) => (
        <article
          key={document.id}
          className="bg-background/60 border-border space-y-1.5 rounded-md border-2 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{copy.documentKinds[document.kind]}</Badge>
            <span className="text-muted-foreground text-xs">
              {copy.brief.from(document.from)}
            </span>
          </div>
          <h3 className="text-sm font-semibold">{document.title}</h3>
          <p className="text-sm leading-relaxed text-pretty">{document.body}</p>
        </article>
      ))}
    </Panel>
  );
}
