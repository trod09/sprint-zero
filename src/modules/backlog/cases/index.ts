/**
 * Pregenerated Backlog Simulator cases (`npm run generate:backlog`).
 *
 * Raw documents: the registry validates them with the case schema on first
 * load. Server only, because they contain the ground truth.
 */
import "server-only";

import fintech01 from "./backlog-fintech-01.json";
import fintech02 from "./backlog-fintech-02.json";
import fintech03 from "./backlog-fintech-03.json";
import marketplace01 from "./backlog-marketplace-01.json";
import marketplace02 from "./backlog-marketplace-02.json";
import saas01 from "./backlog-saas-01.json";
import saas02 from "./backlog-saas-02.json";
import saas03 from "./backlog-saas-03.json";
import consumer01 from "./backlog-consumer-01.json";
import consumer02 from "./backlog-consumer-02.json";

export const backlogRawCases: readonly unknown[] = [
  fintech01,
  fintech02,
  fintech03,
  marketplace01,
  marketplace02,
  saas01,
  saas02,
  saas03,
  consumer01,
  consumer02,
];
