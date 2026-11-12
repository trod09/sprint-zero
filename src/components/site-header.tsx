import Link from "next/link";

import { Mascot } from "@/components/arcade/icons";
import { HeaderPlayer } from "@/components/arcade/player-panel";
import { SoundToggle } from "@/components/arcade/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Messages } from "@/i18n";

const linkClass =
  "font-pixel text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/60 rounded-sm px-2 py-1 whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none";

/**
 * On a phone the links get their own row under the brand, so all four fit
 * without scrolling or cutting a word; from `md` everything is one row.
 */
export function SiteHeader({ messages }: { messages: Messages }) {
  const links = [
    { href: "/#modules", label: messages.nav.modules },
    { href: "/library", label: messages.nav.library },
    { href: "/skills", label: messages.nav.skills },
    { href: "/history", label: messages.nav.history },
  ];
  return (
    <header className="bg-background/95 border-frame sticky top-0 z-40 border-b-2">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 px-4 sm:px-6 md:h-14 md:flex-nowrap">
        <Link
          href="/"
          className="font-pixel focus-visible:ring-ring/60 flex h-12 items-center gap-2 rounded-sm text-base tracking-wide focus-visible:ring-3 focus-visible:outline-none md:h-auto"
        >
          <Mascot size={28} idle={false} />
          <span>{messages.app.name}</span>
        </Link>
        <nav
          aria-label={messages.nav.main}
          className="border-border order-last -mx-2 flex w-[calc(100%+1rem)] items-center justify-between border-t-2 py-1.5 text-sm md:order-none md:mx-0 md:w-auto md:justify-start md:gap-0.5 md:border-t-0 md:py-0"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HeaderPlayer />
          <SoundToggle />
          <ThemeToggle label={messages.nav.toggleTheme} />
          <Link
            href="/login"
            className="font-pixel border-frame hover:bg-muted focus-visible:ring-ring/60 ml-1 rounded-md border-2 px-2.5 py-1 text-sm whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none"
          >
            {messages.auth.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
