"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect } from "react";

import { Button } from "@/components/ui/button";
import { applyTheme, resolveTheme, storeTheme } from "@/lib/theme";

export function ThemeToggle({ label }: { label: string }) {
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
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun className="hidden dark:block" aria-hidden="true" />
      <Moon className="dark:hidden" aria-hidden="true" />
    </Button>
  );
}
