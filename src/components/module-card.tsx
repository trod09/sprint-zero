import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { ModuleIcon } from "@/components/module-icon";
import { Badge } from "@/components/ui/badge";
import type { ModuleMeta } from "@/core/case-engine";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

export function ModuleCard({
  meta,
  messages,
}: {
  meta: ModuleMeta;
  messages: Messages;
}) {
  const isOpen = meta.status !== "coming_soon";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
            isOpen
              ? "border-brand/25 bg-brand/10 text-brand"
              : "bg-muted text-muted-foreground",
          )}
        >
          <ModuleIcon icon={meta.icon} className="size-4.5" />
        </span>
        <Badge variant={isOpen ? "secondary" : "outline"}>
          {messages.status[meta.status]}
        </Badge>
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-base leading-snug font-medium">
          {meta.name}
        </h3>
        <p className="text-muted-foreground text-sm">{meta.tagline}</p>
      </div>

      <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs">
        <span>
          {meta.skills.map((skill) => messages.skills[skill]).join(" · ")}
        </span>
        {meta.estimatedMinutes !== undefined && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {messages.module.minutes(meta.estimatedMinutes)}
          </span>
        )}
        {isOpen && (
          <ArrowRight
            className="text-foreground ml-auto size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  const shell = "flex h-full flex-col gap-4 rounded-xl border bg-card p-4";

  if (!isOpen) {
    return (
      <div className={cn(shell, "border-dashed bg-transparent")}>{body}</div>
    );
  }

  return (
    <Link
      href={`/modules/${meta.id}`}
      className={cn(
        shell,
        "group hover:border-foreground/25 focus-visible:ring-ring/50 shadow-xs transition-colors focus-visible:ring-3 focus-visible:outline-none",
      )}
    >
      {body}
    </Link>
  );
}
