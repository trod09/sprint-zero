/**
 * Server-only registry of playable modules: full definitions, case data and
 * scoring engines. Never import this from a Client Component.
 */
import "server-only";

import { createCaseRepository } from "@/core/case-engine/case-repository";
import {
  createModuleRegistry,
  type RegisteredModule,
} from "@/core/case-engine/registry";

/**
 * Playable modules. Empty until Hito 1.2 registers the Backlog Simulator:
 *   registerModule({ module: backlogModule, loadRawCases: () => backlogCases })
 */
const registeredModules: readonly RegisteredModule[] = [];

export const moduleRegistry = createModuleRegistry(registeredModules);
export const caseRepository = createCaseRepository(moduleRegistry);
