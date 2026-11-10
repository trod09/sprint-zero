/**
 * WCAG contrast between two colors given as #rrggbb. Shared by the contrast
 * test and the styleguide.
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
  const n = parseInt(match[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

/** Text pairs every theme must pass at 4.5:1, as [text, background]. */
export const TEXT_PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["brand", "card"],
  ["brand", "background"],
  ["ink", "card"],
  ["ink", "muted"],
  ["destructive", "card"],
  ["success", "card"],
  ["warning", "card"],
] as const;

/** UI parts that need 3:1 against their background, as [part, background]. */
export const UI_PAIRS = [
  ["frame", "background"],
  ["frame", "card"],
  ["ring", "background"],
] as const;
