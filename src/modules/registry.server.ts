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

import { abTestRawCases } from "./ab-test/cases";
import { abTestModule } from "./ab-test/module.server";
import { backlogRawCases } from "./backlog/cases";
import { generateBacklogOnDemand } from "./backlog/generate";
import { backlogModule } from "./backlog/module.server";
import { feedbackTriageRawCases } from "./feedback-triage/cases";
import { generateTriageOnDemand } from "./feedback-triage/generate";
import { feedbackTriageModule } from "./feedback-triage/module.server";
import { metricDropRawCases } from "./metric-drop/cases";
import { metricDropModule } from "./metric-drop/module.server";
import { productCaseRawCases } from "./product-case/cases";
import { productCaseModule } from "./product-case/module.server";
import { uxCritiqueRawCases } from "./ux-critique/cases";
import { generateUxOnDemand } from "./ux-critique/generate";
import { uxCritiqueModule } from "./ux-critique/module.server";

const registeredModules: readonly RegisteredModule[] = [
  registerModule({
    module: backlogModule,
    loadRawCases: () => backlogRawCases,
    generate: generateBacklogOnDemand,
  }),
  registerModule({
    module: metricDropModule,
    loadRawCases: () => metricDropRawCases,
  }),
  registerModule({
    module: abTestModule,
    loadRawCases: () => abTestRawCases,
  }),
  registerModule({
    module: feedbackTriageModule,
    loadRawCases: () => feedbackTriageRawCases,
    generate: generateTriageOnDemand,
  }),
  registerModule({
    module: uxCritiqueModule,
    loadRawCases: () => uxCritiqueRawCases,
    generate: generateUxOnDemand,
  }),
  registerModule({
    module: productCaseModule,
    loadRawCases: () => productCaseRawCases,
  }),
];

export const moduleRegistry = createModuleRegistry(registeredModules);
export const caseRepository = createCaseRepository(moduleRegistry);
