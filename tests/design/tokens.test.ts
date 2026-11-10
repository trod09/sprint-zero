import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  AVATARS,
  ICONS,
  KANBO,
  MODULE_SPRITES,
} from "@/components/arcade/sprites";
import { contrastRatio, TEXT_PAIRS, UI_PAIRS } from "@/lib/contrast";

const css = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

const light = tokens(":root");
const dark = { ...light, ...tokens(".dark") };

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme contrast", (_, theme) => {
  it.each(TEXT_PAIRS)("%s on %s reaches 4.5:1", (text, background) => {
    expect(
      contrastRatio(theme[text], theme[background]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("%s on %s reaches 3:1", (part, background) => {
    expect(
      contrastRatio(theme[part], theme[background]),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe("module colors", () => {
  it("stand out against the night sky of the banners", () => {
    const modules = Object.entries(light).filter(([key]) =>
      key.startsWith("module-"),
    );
    expect(modules.length).toBeGreaterThanOrEqual(8);
    for (const [key, color] of modules) {
      if (key === "module-locked") continue;
      expect(contrastRatio(color, "#0a0e1f"), key).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("sprites", () => {
  const sprites = [
    ...Object.entries(ICONS).map(([name, s]) => [name, s.rows] as const),
    ...Object.entries(MODULE_SPRITES).map(
      ([name, s]) => [name, s.rows] as const,
    ),
    ["kanbo", KANBO.body] as const,
  ];

  it.each(sprites)("%s has rows of equal width", (_, rows) => {
    expect(new Set(rows.map((row) => row.length)).size).toBe(1);
  });

  it("has six avatars with distinct ids", () => {
    expect(new Set(AVATARS.map((a) => a.id)).size).toBe(6);
  });
});

describe("contrast helper", () => {
  it("reads short and long hex colors alike", async () => {
    const { contrastRatio } = await import("@/lib/contrast");
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000")).toBeCloseTo(21, 5);
    expect(() => contrastRatio("white", "#000")).toThrow();
  });
});
