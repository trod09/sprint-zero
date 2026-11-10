/**
 * The top of every case: the module's world banner with the case title, and
 * Kanbo with a tip for this kind of case. Server component.
 */
import { Badge } from "@/components/ui/badge";
import type { PublicBaseCase } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { getModuleMeta } from "@/modules/catalog";

import { LastAttemptHint } from "./last-attempt-hint";
import { MascotBubble } from "./mascot-bubble";
import { ModuleBanner } from "./module-banner";

/** The tip for a case: fixed per case, picked by its seed. */
export function tipFor(moduleId: string, seed: number): string {
  const tips = getMessages().arcade.tips;
  const list =
    (tips as Record<string, readonly string[]>)[moduleId] ?? tips.default;
  return list[seed % list.length];
}

export function CaseHeader({
  publicCase,
  tag,
  tipKey,
}: {
  publicCase: PublicBaseCase;
  /** An extra label, such as the kind of Product Case. */
  tag?: string;
  /** Picks a more specific tip list than the module's, e.g. "product-case-estimation". */
  tipKey?: string;
}) {
  const messages = getMessages();
  const meta = getModuleMeta(publicCase.moduleId);
  const { company } = publicCase;
  return (
    <div className="space-y-4">
      <ModuleBanner
        moduleId={publicCase.moduleId}
        eyebrow={meta?.name}
        title={publicCase.title}
        headingId="case-title"
        subtitle={
          <>
            <span className="font-semibold text-[#eef1ff]">{company.name}</span>{" "}
            · {company.industry} · {company.stage}. {company.description}
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge>{messages.difficulty[publicCase.difficulty]}</Badge>
          {tag && (
            <Badge
              variant="outline"
              className="border-[#5f6db0] text-[#eef1ff]"
            >
              {tag}
            </Badge>
          )}
        </div>
      </ModuleBanner>
      <LastAttemptHint caseId={publicCase.id} />
      <MascotBubble label={messages.arcade.tipLabel} size={48}>
        {tipFor(tipKey ?? publicCase.moduleId, publicCase.seed)}
      </MascotBubble>
    </div>
  );
}
