import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleIcon } from "@/components/module-icon";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { getModuleMeta, moduleCatalog } from "@/modules/catalog";
import { caseRepository } from "@/modules/registry.server";

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

export default async function ModulePage({
  params,
}: PageProps<"/modules/[module]">) {
  const { module: moduleId } = await params;
  const meta = getModuleMeta(moduleId);
  if (!meta) notFound();

  const messages = getMessages();
  // Public views only: ground truth never leaves the case repository here.
  const cases = await caseRepository.listPublicCases(meta.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-20 sm:px-6">
      <Link
        href="/#modules"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {messages.module.backToModules}
      </Link>

      <header className="mt-6 flex items-start gap-4">
        <span className="border-brand/25 bg-brand/10 text-brand flex size-11 shrink-0 items-center justify-center rounded-xl border">
          <ModuleIcon icon={meta.icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {meta.name}
            </h1>
            <Badge variant="secondary">{messages.status[meta.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-pretty">
            {meta.description}
          </p>
        </div>
      </header>

      <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground">{messages.module.skills}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {meta.skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {messages.skills[skill]}
              </Badge>
            ))}
          </dd>
        </div>
        {meta.estimatedMinutes !== undefined && (
          <div className="text-muted-foreground flex items-center gap-1.5">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-3.5" aria-hidden="true" />
            <dd>{messages.module.minutes(meta.estimatedMinutes)}</dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="cases-title" className="mt-10">
        <h2 id="cases-title" className="font-heading text-lg font-semibold">
          {messages.module.casesTitle}
        </h2>

        {cases.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="font-medium">{messages.module.emptyTitle}</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
              {meta.status === "coming_soon"
                ? messages.module.comingSoonBody
                : messages.module.emptyBody}
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {cases.map((publicCase) => (
              <li
                key={publicCase.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{publicCase.title}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {publicCase.company.name} · {publicCase.company.industry}
                  </p>
                </div>
                <Badge variant="outline">
                  {messages.difficulty[publicCase.difficulty]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
