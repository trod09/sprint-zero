import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/arcade/empty-state";
import { moduleColor } from "@/components/arcade/icons";
import { ModuleBanner } from "@/components/arcade/module-banner";
import { Panel } from "@/components/arcade/panel";
import { GenerateCaseCard } from "@/components/generate-case-card";
import { Badge } from "@/components/ui/badge";
import { WorldLevels } from "@/components/world/world-levels";
import { WorldStats } from "@/components/world/world-stats";
import { getMessages } from "@/i18n";
import { getModuleMeta, moduleCatalog } from "@/modules/catalog";
import { listCaseSummaries } from "@/modules/case-summaries.server";
import { moduleRegistry } from "@/modules/registry.server";

export function generateStaticParams() {
  return moduleCatalog.map((meta) => ({ module: meta.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/modules/[module]">): Promise<Metadata> {
  const { module: moduleId } = await params;
  const meta = getModuleMeta(moduleId);
  return meta ? { title: meta.name, description: meta.tagline } : {};
}

export default function ModulePage({ params }: PageProps<"/modules/[module]">) {
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <ModuleContent params={params} />
    </Suspense>
  );
}

function ModuleSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-6xl animate-pulse space-y-6 px-4 pt-6 pb-20 sm:px-6"
    >
      <div className="bg-muted h-4 w-28 rounded" />
      <div className="bg-muted h-16 rounded-md" />
      <div className="bg-muted h-64 rounded-md" />
    </div>
  );
}

async function ModuleContent({
  params,
}: {
  params: PageProps<"/modules/[module]">["params"];
}) {
  const { module: moduleId } = await params;
  const meta = getModuleMeta(moduleId);
  if (!meta) notFound();

  const messages = getMessages();
  // Public summaries only: ground truth never leaves the case repository here.
  const cases = await listCaseSummaries(meta.id);
  const catalog = cases.map(({ id, moduleId, difficulty }) => ({
    id,
    moduleId,
    difficulty,
  }));
  const worldNumber =
    moduleCatalog
      .filter((m) => m.status !== "coming_soon")
      .findIndex((m) => m.id === meta.id) + 1;

  return (
    <div
      className="world-scope mx-auto w-full max-w-6xl space-y-6 px-4 pt-6 pb-20 sm:px-6"
      style={{ ["--world" as string]: moduleColor(meta.id) }}
    >
      <Link
        href="/#modules"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {messages.module.backToModules}
      </Link>

      <ModuleBanner
        moduleId={meta.id}
        eyebrow={
          worldNumber > 0
            ? messages.module.world(worldNumber)
            : messages.status[meta.status]
        }
        title={meta.name}
        subtitle={meta.tagline}
      >
        <div className="flex flex-wrap items-center gap-2">
          {meta.skills.map((skill) => (
            <Badge key={skill}>{messages.skills[skill]}</Badge>
          ))}
          {meta.estimatedMinutes !== undefined && (
            <Badge
              variant="outline"
              className="border-[#5f6db0] text-[#eef1ff]"
            >
              {messages.module.minutes(meta.estimatedMinutes)}
            </Badge>
          )}
        </div>
      </ModuleBanner>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Panel icon="doc" title={messages.module.aboutTitle}>
          <p className="leading-relaxed text-pretty">{meta.description}</p>
        </Panel>
        {cases.length > 0 && (
          <WorldStats moduleId={meta.id} catalog={catalog} />
        )}
      </div>

      {moduleRegistry.get(meta.id)?.canGenerate && (
        <GenerateCaseCard moduleId={meta.id} />
      )}

      <section aria-labelledby="cases-title" className="space-y-4">
        <h2 id="cases-title" className="font-pixel text-2xl">
          {messages.module.levels.title}
        </h2>
        {cases.length === 0 ? (
          <EmptyState title={messages.module.emptyTitle}>
            {meta.status === "coming_soon"
              ? messages.module.comingSoonBody
              : messages.module.emptyBody}
          </EmptyState>
        ) : (
          <WorldLevels cases={cases} />
        )}
      </section>
    </div>
  );
}
