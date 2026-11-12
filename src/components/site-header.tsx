import Link from "next/link";

import { Mascot } from "@/components/arcade/icons";
import { HeaderPlayer } from "@/components/arcade/player-panel";
import { SoundToggle } from "@/components/arcade/sound-toggle";
import { SiteNav, type NavItem } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Messages } from "@/i18n";

/**
 * The cabinet's top bar: brand, the four sections (the current one lit), the
 * player's level and the console controls. On a phone the sections get their
 * own row so all four fit; from `md` everything is one row.
 */
export function SiteHeader({ messages }: { messages: Messages }) {
  const items: NavItem[] = [
    {
      href: "/#modules",
      label: messages.nav.modules,
      icon: "flag",
      match: ["/modules", "/case"],
    },
    {
      href: "/library",
      label: messages.nav.library,
      icon: "star",
      match: ["/library"],
    },
    {
      href: "/skills",
      label: messages.nav.skills,
      icon: "level",
      match: ["/skills"],
    },
    {
      href: "/history",
      label: messages.nav.history,
      icon: "clock",
      match: ["/history", "/results"],
    },
  ];
  return (
    <header className="bg-background border-frame sticky top-0 z-40 border-b-2">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-stretch gap-x-6 px-4 sm:px-6 md:h-16 md:flex-nowrap">
        <Link
          href="/"
          className="font-pixel focus-visible:ring-ring/60 flex h-14 items-center gap-2.5 rounded-sm text-lg tracking-wide focus-visible:ring-3 focus-visible:outline-none md:h-auto"
        >
          <Mascot size={32} idle={false} />
          <span>{messages.app.name}</span>
        </Link>
        <SiteNav
          label={messages.nav.main}
          items={items}
          className="border-border order-last -mx-2 h-11 w-[calc(100%+1rem)] border-t-2 md:order-none md:mx-0 md:h-auto md:w-auto md:border-t-0"
        />
        <div className="ml-auto flex items-center gap-2">
          <HeaderPlayer />
          <div className="border-frame bg-card flex items-center rounded-md border-2">
            <SoundToggle className="size-8 rounded-none rounded-l-sm" />
            <span aria-hidden="true" className="bg-frame h-5 w-0.5" />
            <ThemeToggle
              label={messages.nav.toggleTheme}
              className="size-8 rounded-none rounded-r-sm"
            />
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">{messages.auth.signIn}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
