/**
 * A module presented as a world: a pixel scene in the module's color, drawn
 * by code from a seed so every world has its own skyline. The scene is
 * always a night sky, in both themes, so its text colors are fixed.
 */
import type { ReactNode } from "react";

import { createRng, hashString } from "@/core/rng";
import { cn } from "@/lib/utils";

import { moduleColor, ModuleSprite } from "./icons";

const WIDTH = 160;
const HEIGHT = 40;
const SKY = "#0a0e1f";
const BANDS = [0.06, 0.1, 0.16, 0.24, 0.34] as const;

interface Scene {
  stars: { x: number; y: number; bright: boolean }[];
  far: { x: number; height: number }[];
  near: { x: number; height: number }[];
}

function buildScene(seedKey: string): Scene {
  const rng = createRng(hashString(seedKey));
  const stars = Array.from({ length: 22 }, () => ({
    x: rng.int(0, WIDTH - 1),
    y: rng.int(1, 18),
    bright: rng.bool(0.3),
  }));
  // Random walks, so the hills look like terrain rather than noise.
  const walk = (step: number, min: number, max: number, start: number) => {
    const columns: { x: number; height: number }[] = [];
    let height = start;
    for (let x = 0; x < WIDTH; x += step) {
      height = Math.min(max, Math.max(min, height + rng.int(-2, 2)));
      columns.push({ x, height });
    }
    return columns;
  };
  return {
    stars,
    far: walk(4, 8, 18, 12),
    near: walk(6, 3, 9, 6),
  };
}

export function ModuleScene({
  moduleId,
  className,
}: {
  moduleId: string;
  className?: string;
}) {
  const color = moduleColor(moduleId);
  const scene = buildScene(moduleId);
  const bandHeight = 28 / BANDS.length;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn("pixelated", className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={WIDTH} height={HEIGHT} fill={SKY} />
      {BANDS.map((opacity, index) => (
        <rect
          key={opacity}
          y={index * bandHeight + 4}
          width={WIDTH}
          height={bandHeight + 0.5}
          fill={color}
          opacity={opacity}
        />
      ))}
      {scene.stars.map((star) => (
        <rect
          key={`${star.x}-${star.y}`}
          x={star.x}
          y={star.y}
          width={1}
          height={1}
          fill={star.bright ? "#ffffff" : color}
          opacity={star.bright ? 0.9 : 0.6}
        />
      ))}
      {scene.far.map((column) => (
        <rect
          key={`far-${column.x}`}
          x={column.x}
          y={HEIGHT - column.height}
          width={4}
          height={column.height}
          fill={color}
          opacity={0.45}
        />
      ))}
      {scene.near.map((column) => (
        <g key={`near-${column.x}`}>
          <rect
            x={column.x}
            y={HEIGHT - column.height}
            width={6}
            height={column.height}
            fill={color}
          />
          <rect
            x={column.x}
            y={HEIGHT - column.height}
            width={6}
            height={1}
            fill="#ffffff"
            opacity={0.35}
          />
        </g>
      ))}
      <rect y={HEIGHT - 2} width={WIDTH} height={2} fill={SKY} opacity={0.4} />
    </svg>
  );
}

export function ModuleBanner({
  moduleId,
  eyebrow,
  title,
  subtitle,
  children,
  size = "default",
  className,
  headingLevel = "h1",
  headingId,
}: {
  moduleId: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra content under the subtitle, such as badges or a button. */
  children?: ReactNode;
  size?: "default" | "sm";
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
  headingId?: string;
}) {
  const Heading = headingLevel;
  return (
    <section
      className={cn(
        "border-frame shadow-pixel relative isolate overflow-hidden rounded-md border-2",
        size === "sm" ? "min-h-28" : "min-h-44",
        className,
      )}
    >
      <ModuleScene
        moduleId={moduleId}
        className="absolute inset-0 -z-10 h-full w-full"
      />
      {/* Keeps the text readable over bright terrain. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0e1f]/95 via-[#0a0e1f]/75 to-[#0a0e1f]/10"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-4 hidden -translate-y-1/2 sm:right-8 sm:block"
      >
        <div className="rounded-sm bg-[#0a0e1f]/60 p-2">
          <ModuleSprite moduleId={moduleId} size={size === "sm" ? 40 : 64} />
        </div>
      </div>
      <div
        className={cn(
          "relative text-[#eef1ff] sm:max-w-[min(40rem,calc(100%-9rem))]",
          size === "sm" ? "px-4 py-4" : "px-5 py-6 sm:px-7",
        )}
      >
        {eyebrow && (
          <p
            className="font-pixel text-xs tracking-widest uppercase"
            style={{ color: moduleColor(moduleId) }}
          >
            {eyebrow}
          </p>
        )}
        <Heading
          id={headingId}
          className={cn(
            "font-pixel mt-1 leading-tight text-balance [text-shadow:2px_2px_0_#000]",
            size === "sm" ? "text-xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </Heading>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-pretty text-[#dfe3fb]">
            {/* A dark plate under each line: the terrain behind can be bright. */}
            <span className="rounded-sm bg-[#0a0e1f]/80 box-decoration-clone px-1.5 py-0.5">
              {subtitle}
            </span>
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
