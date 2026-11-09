/**
 * The pregenerated cases of the Backlog Simulator: which company, difficulty
 * and seed each one is built from.
 *
 * `npm run generate:backlog` turns these into `cases/<id>.json`. A test checks
 * that the committed JSON still matches what the generator produces.
 */
import type { GenerateBacklogCaseOptions } from "./generator";

export const backlogCaseSpecs: readonly GenerateBacklogCaseOptions[] = [
  {
    caseId: "backlog-fintech-01",
    companyKey: "ledgerly",
    difficulty: "apm",
    seed: 1101,
    eventKeys: ["outage-fintech"],
  },
  {
    caseId: "backlog-fintech-02",
    companyKey: "tallybridge",
    difficulty: "pm",
    seed: 1102,
    eventKeys: ["dev-out"],
  },
  {
    caseId: "backlog-fintech-03",
    companyKey: "cobalt-pay",
    difficulty: "senior",
    seed: 1103,
    eventKeys: ["regulator-deadline", "accounts-escalate-import"],
  },
  {
    caseId: "backlog-marketplace-01",
    companyKey: "loopcart",
    difficulty: "apm",
    seed: 1201,
    eventKeys: ["dev-out"],
  },
  {
    caseId: "backlog-marketplace-02",
    companyKey: "crateful",
    difficulty: "pm",
    seed: 1202,
    eventKeys: ["accounts-escalate-import"],
  },
  {
    caseId: "backlog-saas-01",
    companyKey: "stackwise",
    difficulty: "apm",
    seed: 1301,
    eventKeys: ["outage-saas"],
  },
  {
    caseId: "backlog-saas-02",
    companyKey: "relaydesk",
    difficulty: "pm",
    seed: 1302,
    eventKeys: ["consent-deadline"],
  },
  {
    caseId: "backlog-saas-03",
    companyKey: "fieldnote",
    difficulty: "senior",
    seed: 1303,
    eventKeys: ["consent-deadline", "ceo-investor-demo"],
  },
  {
    caseId: "backlog-consumer-01",
    companyKey: "pacewell",
    difficulty: "pm",
    seed: 1401,
    eventKeys: ["outage-consumer"],
  },
  {
    caseId: "backlog-consumer-02",
    companyKey: "parla",
    difficulty: "senior",
    seed: 1402,
    eventKeys: ["dev-out", "sales-promise-custom-feed"],
  },
];
