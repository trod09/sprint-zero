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
import { generateAbTestOnDemand } from "./ab-test/generate";
import { abTestModule } from "./ab-test/module.server";
import { backlogRawCases } from "./backlog/cases";
import { generateBacklogOnDemand } from "./backlog/generate";
import { backlogModule } from "./backlog/module.server";
import { feedbackTriageRawCases } from "./feedback-triage/cases";
import { generateTriageOnDemand } from "./feedback-triage/generate";
import { feedbackTriageModule } from "./feedback-triage/module.server";
import { metricDropRawCases } from "./metric-drop/cases";
import { generateMetricDropOnDemand } from "./metric-drop/generate";
import { metricDropModule } from "./metric-drop/module.server";
import { prdRawCases } from "./prd-writer/cases";
import { prdWriterModule } from "./prd-writer/module.server";
import { productCaseRawCases } from "./product-case/cases";
import { generateProductCaseOnDemand } from "./product-case/generate";
import { productCaseModule } from "./product-case/module.server";
import { buildFeaturedRoadmapCases } from "./roadmap-okrs/cases";
import { generateRoadmapOnDemand } from "./roadmap-okrs/generate";
import { roadmapModule } from "./roadmap-okrs/module.server";
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
    generate: generateMetricDropOnDemand,
  }),
  registerModule({
    module: abTestModule,
    loadRawCases: () => abTestRawCases,
    generate: generateAbTestOnDemand,
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
    generate: generateProductCaseOnDemand,
  }),
  registerModule({
    module: prdWriterModule,
    loadRawCases: () => prdRawCases,
  }),
  registerModule({
    module: roadmapModule,
    loadRawCases: buildFeaturedRoadmapCases,
    generate: generateRoadmapOnDemand,
  }),
];

export const moduleRegistry = createModuleRegistry(registeredModules);
export const caseRepository = createCaseRepository(moduleRegistry);
