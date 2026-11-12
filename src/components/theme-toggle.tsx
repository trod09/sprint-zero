"use client";

import { useLayoutEffect } from "react";

import { PixelIcon } from "@/components/arcade/icons";
import { Button } from "@/components/ui/button";
import { applyTheme, resolveTheme, storeTheme } from "@/lib/theme";

export function ThemeToggle({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  // The inline script in <head> sets the theme before paint. In development,
  // Strict Mode remounts and resets <html> attributes, so re-apply it here.
  useLayoutEffect(() => {
    applyTheme(resolveTheme());
  }, []);

  const toggle = () => {
    const next = resolveTheme() === "dark" ? "light" : "dark";
    storeTheme(next);
    applyTheme(next);
  };

  // Both icons are rendered and CSS picks one, so server and client markup match.
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <PixelIcon name="sun" size={18} className="hidden dark:block" />
      <PixelIcon name="moon" size={18} className="dark:hidden" />
    </Button>
  );
}
