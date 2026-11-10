/**
 * Renders pixel art drawn as rows of characters. Each character is a palette
 * key; "." is transparent and "#" is the current text color, so icons can be
 * tinted with `text-*` or `style={{ color }}`. Runs of the same color are
 * merged into one rect, and `crispEdges` keeps every pixel sharp.
 */
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type Palette = Record<string, string>;

export interface SpriteLayer {
  rows: readonly string[];
  palette?: Palette;
  className?: string;
}

interface Run {
  x: number;
  y: number;
  width: number;
  color: string;
}

function runsOf(rows: readonly string[], palette: Palette): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      if (key === ".") {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === key) end += 1;
      const color = key === "#" ? "currentColor" : palette[key];
      if (color) runs.push({ x, y, width: end - x, color });
      x = end;
    }
  });
  return runs;
}

export function PixelArt({
  layers,
  palette = {},
  size,
  title,
  className,
  style,
}: {
  layers: readonly SpriteLayer[];
  palette?: Palette;
  /** Rendered width in CSS pixels; height follows the sprite's ratio. */
  size?: number;
  /** Accessible name. Without it the art is decorative. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const width = Math.max(...layers.flatMap((l) => l.rows.map((r) => r.length)));
  const height = Math.max(...layers.map((l) => l.rows.length));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size ? (size * height) / width : undefined}
      className={cn("pixelated shrink-0", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
    >
      {layers.map((layer, index) => (
        <g key={index} className={layer.className}>
          {runsOf(layer.rows, { ...palette, ...layer.palette }).map((run) => (
            <rect
              key={`${run.x}-${run.y}`}
              x={run.x}
              y={run.y}
              width={run.width}
              height={1}
              fill={run.color}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
