"use client";

/**
 * The main links, with the current section lit like a selected tab: the
 * link brightens and a gold bar rests on the header's bottom frame.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { PixelIcon } from "@/components/arcade/icons";
import type { IconName } from "@/components/arcade/sprites";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Path prefixes that belong to this section. */
  match: readonly string[];
}

export function SiteNav({
  label,
  items,
  className,
}: {
  label: string;
  items: readonly NavItem[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      {/* The pathname of a route with dynamic params is only known per
          request (Cache Components): the static shell shows the same links,
          none lit, until it is. */}
      <Suspense fallback={<NavList items={items} pathname={null} />}>
        <CurrentNavList items={items} />
      </Suspense>
    </nav>
  );
}

function CurrentNavList({ items }: { items: readonly NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}

function NavList({
  items,
  pathname,
}: {
  items: readonly NavItem[];
  pathname: string | null;
}) {
  return (
    <ul className="flex h-full items-stretch justify-between md:justify-start md:gap-1">
      {items.map((item) => {
        const current =
          pathname !== null &&
          item.match.some(
            (prefix) =>
              pathname === prefix || pathname.startsWith(`${prefix}/`),
          );
        return (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "group font-pixel focus-visible:ring-ring/60 relative flex items-center gap-1.5 px-2 text-sm whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset md:px-3",
                current
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "transition-colors",
                  current
                    ? "text-ink"
                    : "group-hover:text-foreground text-current",
                )}
              >
                <PixelIcon name={item.icon} size={14} />
              </span>
              {item.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-1 -bottom-0.5 h-[3px] transition-colors",
                  current
                    ? "bg-primary ring-frame ring-1 dark:ring-0"
                    : "group-hover:bg-frame bg-transparent",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
