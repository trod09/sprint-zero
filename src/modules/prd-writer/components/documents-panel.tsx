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
    <section
      aria-labelledby="documents-title"
      tabIndex={0}
      className="pixel-card focus-visible:ring-ring/50 space-y-3 p-4 focus-visible:ring-3 focus-visible:outline-none lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      <div>
        <h2 id="documents-title" className="font-heading font-semibold">
          {copy.brief.documents}
        </h2>
        <p className="text-muted-foreground text-xs">
          {copy.brief.documentsIntro}
        </p>
      </div>
      <ul className="space-y-4">
        {documents.map((document) => (
          <li key={document.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {copy.documentKinds[document.kind]}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {copy.brief.from(document.from)}
              </span>
            </div>
            <h3 className="text-sm font-medium">{document.title}</h3>
            <p className="text-sm leading-relaxed text-pretty">
              {document.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
