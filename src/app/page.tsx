import Link from "next/link";

import { ModuleSprite, PixelIcon } from "@/components/arcade/icons";
import { ModuleBanner } from "@/components/arcade/module-banner";
import { PlayerPanel } from "@/components/arcade/player-panel";
import { DailyCaseCard } from "@/components/home/daily-case";
import { HomeHero } from "@/components/home/home-hero";
import { WorldProgress } from "@/components/home/world-progress";
import { getMessages } from "@/i18n";
import { moduleCatalog } from "@/modules/catalog";
import { listCaseSummaries } from "@/modules/case-summaries.server";
import { moduleRegistry } from "@/modules/registry.server";

export default async function HomePage() {
  const messages = getMessages();
  const copy = messages.arcade;
  const summaries = await listCaseSummaries();
  const catalog = summaries.map(({ id, moduleId, difficulty }) => ({
    id,
    moduleId,
    difficulty,
  }));
  const generating = moduleRegistry
    .list()
    .filter((registered) => registered.canGenerate)
    .map((registered) => registered.meta.id);
  const worlds = moduleCatalog.filter((meta) => meta.status !== "coming_soon");
  const locked = moduleCatalog.filter((meta) => meta.status === "coming_soon");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <section className="pt-10 pb-4">
        <p className="font-pixel text-ink text-xs tracking-widest uppercase">
          {messages.home.eyebrow}
        </p>
        <h1 className="font-pixel mt-2 max-w-3xl text-3xl leading-tight text-balance sm:text-4xl">
          {messages.home.title}
        </h1>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <HomeHero catalog={summaries} />
          <DailyCaseCard moduleIds={generating} />
        </div>
        <PlayerPanel catalog={catalog} className="lg:sticky lg:top-20" />
      </div>

      <section
        id="modules"
        aria-labelledby="worlds-title"
        className="scroll-mt-20 pt-14"
      >
        <h2 id="worlds-title" className="font-pixel text-2xl">
          {copy.worlds.title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {copy.worlds.subtitle}
        </p>
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {worlds.map((meta, index) => (
            <li
              key={meta.id}
              className="pixel-card pixel-lift focus-within:ring-ring/60 relative overflow-hidden focus-within:ring-3"
              style={{ ["--world" as string]: `var(--module-${meta.id})` }}
            >
              <ModuleBanner
                moduleId={meta.id}
                eyebrow={copy.world(index + 1)}
                title={meta.name}
                subtitle={meta.tagline}
                size="sm"
                headingLevel="h3"
                className="rounded-none border-0 border-b-2 shadow-none"
              />
              <div className="space-y-2 p-4">
                <p className="text-muted-foreground text-sm">
                  {meta.description}
                </p>
                <WorldProgress moduleId={meta.id} catalog={catalog} />
              </div>
              <Link
                href={`/modules/${meta.id}`}
                aria-label={copy.worlds.enter(meta.name)}
                className="absolute inset-0 z-10 outline-none"
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="locked-title" className="pt-14">
        <h2 id="locked-title" className="font-pixel text-xl">
          {copy.worlds.comingSoon}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {messages.home.comingSoonSubtitle}
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locked.map((meta) => (
            <li
              key={meta.id}
              className="bg-card border-frame flex items-start gap-3 rounded-md border-2 border-dashed p-4 opacity-80"
            >
              <ModuleSprite moduleId={meta.id} size={28} />
              <div className="min-w-0">
                <p className="font-pixel flex items-center gap-1.5 text-sm">
                  {meta.name}
                  <PixelIcon
                    name="lock"
                    size={12}
                    title={copy.locked}
                    className="text-muted-foreground"
                  />
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {meta.tagline}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
