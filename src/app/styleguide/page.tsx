import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  ModuleSprite,
  Mascot,
  PixelAvatar,
  PixelIcon,
} from "@/components/arcade/icons";
import { MascotBubble } from "@/components/arcade/mascot-bubble";
import { ModuleBanner } from "@/components/arcade/module-banner";
import { PlayerPanel } from "@/components/arcade/player-panel";
import { AVATARS, ICONS, MODULE_SPRITES } from "@/components/arcade/sprites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { moduleCatalog } from "@/modules/catalog";
import { listCaseSummaries } from "@/modules/case-summaries.server";

import { ContrastTable } from "./contrast-table";
import { AnimatedDemos } from "./demos";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false },
};

const COLOR_TOKENS = [
  "background",
  "card",
  "muted",
  "foreground",
  "muted-foreground",
  "frame",
  "border",
  "primary",
  "secondary",
  "brand",
  "ink",
  "success",
  "warning",
  "destructive",
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 border-t-2 border-dashed pt-8"
    >
      <h2 id={id} className="font-pixel text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function StyleguidePage() {
  const messages = getMessages();
  const copy = messages.arcade.styleguide;
  const catalog = await listCaseSummaries();
  const playable = moduleCatalog.filter((m) => m.status !== "coming_soon");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-pixel text-4xl">{copy.title}</h1>
        <p className="text-muted-foreground max-w-2xl">{copy.intro}</p>
      </header>

      <Section id="tokens" title={copy.tokens}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLOR_TOKENS.map((token) => (
            <li key={token} className="space-y-1">
              <div
                className="border-frame shadow-pixel-sm h-14 rounded-sm border-2"
                style={{ background: `var(--${token})` }}
              />
              <p className="font-mono text-xs">--{token}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="modules" title={copy.modules}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ...playable.map((m) => ({ id: m.id, name: m.name })),
            { id: "locked", name: messages.arcade.locked },
          ].map((module) => (
            <li
              key={module.id}
              className="pixel-card flex items-center gap-3 p-3"
            >
              <ModuleSprite moduleId={module.id} size={28} />
              <div>
                <p className="font-pixel text-sm">{module.name}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  --module-{module.id}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="type" title={copy.type}>
        <div className="space-y-3">
          <p className="font-pixel text-4xl">Pixelify Sans · LEVEL 7</p>
          <p className="font-pixel text-xl">
            Titles, buttons, XP numbers and short labels
          </p>
          <p className="max-w-2xl text-base leading-relaxed">
            Nunito for reading: briefs, tickets and feedback. The sprint has
            eight engineering days left, two of them already promised to the
            payments team, and the support queue doubled after Tuesday&apos;s
            release.
          </p>
          <p className="font-mono text-sm">Geist Mono · 12,480 DAU · −15.2%</p>
        </div>
      </Section>

      <Section id="buttons" title={copy.buttons}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Start case</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">
            Large <PixelIcon name="play" size={14} />
          </Button>
          <Button size="icon" variant="outline" aria-label="Star">
            <PixelIcon name="star" size={16} />
          </Button>
        </div>
      </Section>

      <Section id="badges" title={copy.badges}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Alert</Badge>
          <Badge variant="outline">{messages.difficulty.senior}</Badge>
        </div>
      </Section>

      <Section id="cards" title={copy.cards}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>2px frame, solid offset shadow.</CardDescription>
            </CardHeader>
            <CardContent>Content in Nunito for reading.</CardContent>
          </Card>
          <a href="#cards" className="pixel-card pixel-lift block p-4">
            <p className="font-pixel">Clickable card</p>
            <p className="text-muted-foreground text-sm">
              Lifts on hover, sinks on press.
            </p>
          </a>
          <div className="bg-card rounded-md border p-4">
            <p className="font-pixel">Flat surface</p>
            <p className="text-muted-foreground text-sm">
              For dense data: tables and charts.
            </p>
          </div>
        </div>
      </Section>

      <Section id="forms" title={copy.forms}>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="sg-input">Input</Label>
            <Input id="sg-input" placeholder="Type here" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sg-invalid">Invalid</Label>
            <Input id="sg-invalid" aria-invalid defaultValue="abc" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="sg-textarea">Textarea</Label>
            <Textarea id="sg-textarea" placeholder="Your reasoning" />
          </div>
          <Tabs defaultValue="one">
            <TabsList>
              <TabsTrigger value="one">Scorecard</TabsTrigger>
              <TabsTrigger value="two">Segments</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Section>

      <Section id="icons" title={copy.icons}>
        <ul className="flex flex-wrap gap-4">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((name) => (
            <li key={name} className="flex flex-col items-center gap-1">
              <div className="bg-muted border-frame rounded-sm border-2 p-2">
                <PixelIcon name={name} size={32} />
              </div>
              <span className="font-mono text-xs">{name}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-4">
          {Object.keys(MODULE_SPRITES).map((id) => (
            <li key={id} className="flex flex-col items-center gap-1">
              <div className="border-frame rounded-sm border-2 bg-[#0a0e1f] p-2">
                <ModuleSprite moduleId={id} size={32} />
              </div>
              <span className="font-mono text-xs">{id}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-6">
          <Mascot size={96} title={messages.arcade.mascotAlt} />
          <Mascot size={48} idle={false} />
          {AVATARS.map((avatar) => (
            <PixelAvatar
              key={avatar.id}
              id={avatar.id}
              size={48}
              title={avatar.id}
            />
          ))}
        </div>
      </Section>

      <Section id="game" title={copy.game}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <MascotBubble label={messages.arcade.tipLabel}>
              {messages.arcade.tips.backlog[0]}
            </MascotBubble>
            <ModuleBanner
              moduleId="backlog"
              eyebrow={messages.arcade.world(1)}
              title="Backlog Simulator"
              subtitle="Plan a sprint under pressure."
              headingLevel="h3"
            />
            <ModuleBanner
              moduleId="metric-drop"
              eyebrow={messages.arcade.world(2)}
              title="Metric Drop"
              size="sm"
              headingLevel="h3"
            />
          </div>
          <PlayerPanel catalog={catalog} />
        </div>
        <AnimatedDemos />
      </Section>

      <Section id="contrast" title={copy.contrast}>
        <p className="text-muted-foreground text-sm">{copy.contrastIntro}</p>
        <div className="pixel-card max-w-2xl p-4">
          <ContrastTable />
        </div>
      </Section>
    </div>
  );
}
