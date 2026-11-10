import { cn } from "@/lib/utils";

import { PixelArt } from "./pixel-art";
import {
  avatarSprite,
  ICONS,
  KANBO,
  MODULE_SPRITES,
  type IconName,
} from "./sprites";

/** Module ids with their own color token in globals.css. */
const MODULE_COLORS = new Set([
  "backlog",
  "metric-drop",
  "ab-test",
  "feedback-triage",
  "ux-critique",
  "product-case",
  "prd-writer",
]);

/** The module's accent color, or the "locked" grey for modules not built yet. */
export function moduleColor(moduleId: string): string {
  return MODULE_COLORS.has(moduleId)
    ? `var(--module-${moduleId})`
    : "var(--module-locked)";
}

export function PixelIcon({
  name,
  size = 16,
  title,
  className,
}: {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}) {
  const sprite = ICONS[name];
  return (
    <PixelArt
      layers={[sprite]}
      palette={"palette" in sprite ? sprite.palette : undefined}
      size={size}
      title={title}
      className={className}
    />
  );
}

/** A module's pixel icon in its own color. */
export function ModuleSprite({
  moduleId,
  size = 24,
  className,
  color,
}: {
  moduleId: string;
  size?: number;
  className?: string;
  /** Overrides the module color, e.g. for the "locked" look. */
  color?: string;
}) {
  const sprite = MODULE_SPRITES[moduleId] ?? MODULE_SPRITES["quick-cases"];
  return (
    <PixelArt
      layers={[sprite]}
      size={size}
      className={className}
      style={{ color: color ?? moduleColor(moduleId) }}
    />
  );
}

/** Kanbo, the mascot. It blinks, and bobs when `idle` is on. */
export function Mascot({
  size = 64,
  idle = true,
  title,
  className,
}: {
  size?: number;
  idle?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <PixelArt
      layers={[
        { rows: KANBO.body },
        { rows: KANBO.lids },
        { rows: KANBO.eyes, className: "animate-pixel-blink" },
        {
          rows: KANBO.light,
          className: "animate-pixel-blink [animation-delay:1.3s]",
        },
      ]}
      palette={KANBO.palette}
      size={size}
      title={title}
      className={cn(idle && "animate-pixel-bob", className)}
    />
  );
}

export function PixelAvatar({
  id,
  size = 48,
  title,
  className,
}: {
  id: string;
  size?: number;
  title?: string;
  className?: string;
}) {
  const sprite = avatarSprite(id);
  return (
    <PixelArt
      layers={[sprite]}
      palette={sprite.palette}
      size={size}
      title={title}
      className={className}
    />
  );
}
