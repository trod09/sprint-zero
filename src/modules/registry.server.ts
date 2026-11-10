/**
 * Server-only registry of playable modules: full definitions, case data and
 * scoring engines. Never import this from a Client Component.
 */
import "server-only";

import { createCaseRepository } from "@/core/case-engine/case-repository";
import {
  createModuleRegistry,
  registerModule,
  type RegisteredModule,
} from "@/core/case-engine/registry";

import { backlogRawCases } from "./backlog/cases";
import { backlogModule } from "./backlog/module.server";
import { metricDropRawCases } from "./metric-drop/cases";
import { metricDropModule } from "./metric-drop/module.server";

const registeredModules: readonly RegisteredModule[] = [
  registerModule({
    module: backlogModule,
    loadRawCases: () => backlogRawCases,
  }),
  registerModule({
    module: metricDropModule,
    loadRawCases: () => metricDropRawCases,
  }),
];

export const moduleRegistry = createModuleRegistry(registeredModules);
export const caseRepository = createCaseRepository(moduleRegistry);
