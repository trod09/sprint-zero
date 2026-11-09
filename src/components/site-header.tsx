import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import type { Messages } from "@/i18n";

export function SiteHeader({ messages }: { messages: Messages }) {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading focus-visible:ring-ring/50 flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight focus-visible:ring-3 focus-visible:outline-none"
        >
          <span
            className="bg-brand text-brand-foreground flex size-6 items-center justify-center rounded-md font-mono text-xs font-bold"
            aria-hidden="true"
          >
            0
          </span>
          {messages.app.name}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/#modules"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-2 py-1 transition-colors focus-visible:ring-3 focus-visible:outline-none"
          >
            {messages.nav.modules}
          </Link>
        </nav>
        <div className="ml-auto">
          <ThemeToggle label={messages.nav.toggleTheme} />
        </div>
      </div>
    </header>
  );
}
