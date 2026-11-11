import { Panel } from "@/components/arcade/panel";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

import type { ResearchNote } from "../schema";

export function ResearchPanel({ notes }: { notes: readonly ResearchNote[] }) {
  const copy = getMessages().productCase;
  return (
    <Panel
      id="research-title"
      icon="doc"
      title={copy.brief.research}
      subtitle={copy.brief.researchIntro}
      aside={notes.length}
    >
      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="bg-background/60 border-border space-y-1.5 rounded-md border-2 p-3"
          >
            <Badge variant="outline">{copy.sources[note.source]}</Badge>
            <p className="text-sm leading-relaxed text-pretty">{note.text}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
