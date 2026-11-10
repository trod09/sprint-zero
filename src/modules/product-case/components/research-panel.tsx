import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

import type { ResearchNote } from "../schema";

export function ResearchPanel({ notes }: { notes: readonly ResearchNote[] }) {
  const copy = getMessages().productCase;
  return (
    <section
      aria-labelledby="research-title"
      className="bg-card space-y-3 rounded-xl border p-4"
    >
      <div>
        <h2 id="research-title" className="font-heading font-semibold">
          {copy.brief.research}
        </h2>
        <p className="text-muted-foreground text-xs">
          {copy.brief.researchIntro}
        </p>
      </div>
      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="space-y-1">
            <Badge variant="outline">{copy.sources[note.source]}</Badge>
            <p className="text-sm leading-relaxed text-pretty">{note.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
