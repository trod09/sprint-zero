import { ModuleCard } from "@/components/module-card";
import { getMessages } from "@/i18n";
import { moduleCatalog } from "@/modules/catalog";

export default function HomePage() {
  const messages = getMessages();
  const upNext = moduleCatalog.filter((meta) => meta.status !== "coming_soon");
  const comingSoon = moduleCatalog.filter(
    (meta) => meta.status === "coming_soon",
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="max-w-3xl pt-16 pb-12 sm:pt-20">
        <p className="text-brand font-mono text-xs tracking-wide uppercase">
          {messages.home.eyebrow}
        </p>
        <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {messages.home.title}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          {messages.home.subtitle}
        </p>
      </section>

      <dl className="bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-3">
        {messages.home.pillars.map((pillar) => (
          <div key={pillar.title} className="bg-background p-4">
            <dt className="text-sm font-medium">{pillar.title}</dt>
            <dd className="text-muted-foreground mt-1 text-sm">
              {pillar.body}
            </dd>
          </div>
        ))}
      </dl>

      <section
        id="modules"
        aria-labelledby="up-next-title"
        className="scroll-mt-20 pt-14"
      >
        <h2 id="up-next-title" className="font-heading text-lg font-semibold">
          {messages.home.upNextTitle}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {messages.home.upNextSubtitle}
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {upNext.map((meta) => (
            <li key={meta.id}>
              <ModuleCard meta={meta} messages={messages} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="coming-soon-title" className="pt-14 pb-20">
        <h2
          id="coming-soon-title"
          className="font-heading text-lg font-semibold"
        >
          {messages.home.comingSoonTitle}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {messages.home.comingSoonSubtitle}
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((meta) => (
            <li key={meta.id}>
              <ModuleCard meta={meta} messages={messages} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
