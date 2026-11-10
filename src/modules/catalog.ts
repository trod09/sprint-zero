/**
 * Client-safe catalog of every module: metadata only, no case data.
 *
 * To add a module: create `src/modules/<id>/module.ts`, list its meta here and
 * register its server definition in `registry.server.ts`.
 */
import type { ModuleMeta } from "@/core/case-engine";

import { abTestMeta } from "./ab-test/module";
import { backlogMeta } from "./backlog/module";
import { comingSoonModules } from "./coming-soon";
import { metricDropMeta } from "./metric-drop/module";

export const moduleCatalog: readonly ModuleMeta[] = [
  backlogMeta,
  metricDropMeta,
  abTestMeta,
  ...comingSoonModules,
];

export function getModuleMeta(moduleId: string): ModuleMeta | undefined {
  return moduleCatalog.find((meta) => meta.id === moduleId);
}
