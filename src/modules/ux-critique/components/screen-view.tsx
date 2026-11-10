"use client";

import { getMessages } from "@/i18n";

import type { PublicUxCritiqueCase } from "../schema";
import { CheckoutScreen } from "./screens/checkout-screen";
import { RegionContext, type RegionContextValue } from "./screens/region";
import { SettingsScreen } from "./screens/settings-screen";
import { SignupScreen } from "./screens/signup-screen";

/** The mock screen in a browser-like frame. Always light: it is the product. */
export function ScreenView({
  screen,
  context,
}: {
  screen: PublicUxCritiqueCase["screen"];
  context: Omit<RegionContextValue, "labels">;
}) {
  const copy = getMessages().ux.frame;
  const labels = new Map(
    screen.regions.map((region) => [region.id, region.label]),
  );
  const props = {
    regions: screen.regions,
    product: screen.product.name,
    accent: screen.product.accent,
  };
  const host = `${screen.product.name.toLowerCase().replace(/\s+/g, "")}.com`;

  return (
    <figure
      aria-label={copy.label(screen.product.name)}
      // Planted contrast and labelling flaws are the exercise: accessibility checks skip this.
      data-mock-screen=""
      className="overflow-hidden rounded-xl border border-zinc-300 shadow-sm"
      style={{ colorScheme: "light" }}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
        </span>
        <span className="flex-1 truncate rounded-md bg-white px-2 py-0.5 text-center font-mono text-xs text-zinc-500">
          {host}/{screen.template}
        </span>
      </div>
      <RegionContext.Provider value={{ ...context, labels }}>
        {screen.template === "signup" && <SignupScreen {...props} />}
        {screen.template === "checkout" && <CheckoutScreen {...props} />}
        {screen.template === "settings" && <SettingsScreen {...props} />}
      </RegionContext.Provider>
    </figure>
  );
}
