import Link from "next/link";

import { Mascot } from "@/components/arcade/icons";
import { HeaderPlayer } from "@/components/arcade/player-panel";
import { SoundToggle } from "@/components/arcade/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Messages } from "@/i18n";

export function SiteHeader({ messages }: { messages: Messages }) {
  return (
    <header className="bg-background/95 border-frame sticky top-0 z-40 border-b-2">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="font-pixel focus-visible:ring-ring/60 flex items-center gap-2 rounded-sm text-base tracking-wide focus-visible:ring-3 focus-visible:outline-none"
        >
          <Mascot size={28} idle={false} />
          <span className="hidden sm:inline">{messages.app.name}</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm">
          {[
            { href: "/#modules", label: messages.nav.modules },
            { href: "/library", label: messages.nav.library },
            { href: "/skills", label: messages.nav.skills },
            { href: "/history", label: messages.nav.history },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-pixel text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/60 rounded-sm px-2 py-1 whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HeaderPlayer />
          <SoundToggle />
          <ThemeToggle label={messages.nav.toggleTheme} />
        </div>
      </div>
    </header>
  );
}
