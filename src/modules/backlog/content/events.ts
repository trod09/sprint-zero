/**
 * Mid-sprint events. Each one either takes capacity away, adds an urgent
 * ticket, or both. Some urgent tickets are genuine and some are traps.
 */
import type { EventTemplate, Industry } from "./types";

const OUTAGE_GUIDANCE =
  "An outage outranks planned work. Pull the hotfix in and take the lowest-value items out to make room: adding it on top of a full sprint only moves the failure to the end of the sprint.";

function outage(
  industry: Industry,
  title: string,
  description: string,
  ticketTitle: string,
  ticketDescription: string,
): EventTemplate {
  return {
    key: `outage-${industry}`,
    type: "production_outage",
    industries: [industry],
    title,
    description,
    ticket: {
      key: `outage-${industry}-hotfix`,
      type: "bug",
      by: "engineering",
      title: ticketTitle,
      description: ticketDescription,
      critical: true,
      value: [90, 98],
      effort: [3, 5],
      signals: { reach: "high", support: "high" },
      moves: ["retention", "nps"],
      why: "Production is broken for customers right now. Nothing planned before the incident is worth more than ending it.",
    },
    guidance: OUTAGE_GUIDANCE,
  };
}

export const eventTemplates: readonly EventTemplate[] = [
  // ------------------------------------------------------ capacity / urgent
  outage(
    "fintech",
    "Production incident: transfers stuck in 'pending'",
    "Since 08:40 new transfers are accepted but never leave. {engineer} traced it to the payment worker, which crashes on a new bank response code. Customers are calling.",
    "Hotfix: payment worker crashes on new bank response code",
    "Handle the new response code, restart the worker safely and release the stuck transfers without sending any of them twice.",
  ),
  outage(
    "marketplace",
    "Production incident: checkout fails for one in three orders",
    "Since this morning a third of checkouts end with an error after the buyer pays. {engineer} found a timeout between the order service and the payment provider. Buyers are being charged without an order.",
    "Hotfix: orders lost after payment on checkout timeout",
    "Make order creation survive the provider timeout and reconcile the payments that were taken without an order.",
  ),
  outage(
    "saas",
    "Production incident: file uploads fail in every workspace",
    "Since last night's deploy no customer can attach files. {engineer} traced it to an expired storage credential that was never rotated. Support has 60 tickets and counting.",
    "Hotfix: rotate storage credentials and restore uploads",
    "Rotate the credential, restore uploads and add the rotation to the release checklist so it cannot expire unnoticed again.",
  ),
  outage(
    "consumer",
    "Production incident: subscriptions cannot be purchased on iOS",
    "Since yesterday's release the purchase sheet closes with an error on iOS. {engineer} found that the product identifiers changed in the build. No new subscriber has been able to pay for 20 hours.",
    "Hotfix: restore in-app purchases on iOS",
    "Fix the product identifiers, ship an expedited release and verify purchases end to end before closing the incident.",
  ),
  {
    key: "dev-out",
    type: "dev_unavailable",
    title: "{engineer} is out for the rest of the sprint",
    description:
      "{engineer}, one of the senior engineers, is on unexpected leave from today. Their work in progress has to be picked up by the rest of the team.",
    capacityLoss: [0.18, 0.26],
    guidance:
      "Capacity dropped, so scope has to drop with it. Cut the lowest-value work and protect the critical tickets. Asking the team to absorb the difference is how sprints fail quietly.",
  },
  {
    key: "regulator-deadline",
    type: "compliance_deadline",
    industries: ["fintech"],
    title: "The regulator moved a reporting deadline forward",
    description:
      "{requester} received a notice this morning: the new transaction report format becomes mandatory at the end of this sprint, a month earlier than announced.",
    ticket: {
      key: "regulator-report-format",
      type: "feature",
      by: "compliance",
      title: "Transaction report in the regulator's new format",
      description:
        "Produce the monthly transaction report in the new mandatory format before the deadline at the end of this sprint.",
      critical: true,
      value: [85, 93],
      effort: [3, 5],
      signals: { hint: "Mandatory from the end of this sprint." },
      moves: [],
      why: "A legal deadline that moved is still a legal deadline. Missing a mandatory report puts the licence at risk.",
    },
    guidance:
      "Legal deadlines are constraints, not priorities to weigh. Take it in, then decide what leaves the sprint to pay for it.",
  },
  {
    key: "consent-deadline",
    type: "compliance_deadline",
    industries: ["marketplace", "saas", "consumer"],
    title: "Legal: the new consent rules apply from the 1st",
    description:
      "{requester} forwarded a note from the lawyers. The privacy authority's new guidance takes effect on the 1st, and the current consent screen does not meet it.",
    ticket: {
      key: "consent-screen-update",
      type: "feature",
      by: "ceo",
      title: "Update the consent screen to meet the new privacy guidance",
      description:
        "Change the consent screen and stored consent records to match the new guidance before it takes effect on the 1st.",
      critical: true,
      value: [84, 92],
      effort: [3, 5],
      signals: { reach: "high", hint: "Takes effect on the 1st." },
      moves: [],
      why: "From the 1st the current screen is non-compliant for every user. A dated legal requirement goes in whatever it displaces.",
    },
    guidance:
      "Legal deadlines are constraints, not priorities to weigh. Take it in, then decide what leaves the sprint to pay for it.",
  },
  // --------------------------------------------------------------- judgment
  {
    key: "sales-promise-custom-feed",
    type: "sales_promise",
    title:
      "{requester} promised {customer} a custom data feed by the end of the sprint",
    description:
      "On a call yesterday {requester} told {customer} they would have a nightly data feed in their own format before the sprint ends. The contract is not signed yet. {requester} says the deal depends on it.",
    ticket: {
      key: "custom-data-feed",
      type: "sales_request",
      by: "sales",
      title: "Nightly data feed in {customer}'s format",
      description:
        "Build a nightly export to {customer}'s file server, in the column layout and naming they specified.",
      trap: "single_customer",
      value: [14, 24],
      effort: [5, 8],
      debt: [3, 6],
      signals: {
        revenue: "high",
        hint: "Promised to {customer} for the end of this sprint.",
      },
      moves: ["revenue"],
      why: "A bespoke feed for an account that has not signed. The promise was made without the team, and a standard export covers what they need.",
    },
    guidance:
      "A promise made without the team is the start of a negotiation, not a commitment. Find out what the customer actually needs and offer the standard option or a later date. Do not trade work that helps everyone for one unsigned deal.",
  },
  {
    key: "accounts-escalate-import",
    type: "sales_promise",
    industries: ["fintech", "marketplace", "saas"],
    title: "Three of the largest accounts escalate the same blocker",
    description:
      "{requester} brings the same complaint from three top accounts in one week: bulk import stops at 500 rows, and each of them needs to load thousands. Two have paused their rollout until it works.",
    ticket: {
      key: "bulk-import-limit",
      type: "bug",
      by: "sales",
      title: "Bulk import fails above 500 rows",
      description:
        "The import job times out on files with more than 500 rows. Process large files in batches and report progress.",
      value: [70, 82],
      effort: [3, 5],
      signals: {
        revenue: "high",
        hint: "Three top accounts, two rollouts on hold.",
      },
      moves: ["revenue", "retention"],
      why: "Three large accounts with the same concrete, reproducible blocker is evidence, not noise. A small fix protects a lot of revenue.",
    },
    guidance:
      "Not every escalation from sales is a trap. Several accounts with one specific, reproducible problem and a small fix is worth pulling in. Pay for it by removing the weakest item, not by overbooking.",
  },
  {
    key: "ceo-investor-demo",
    type: "ceo_escalation",
    title: "{requester} wants a demo feature for next week's investor meeting",
    description:
      "{requester} came back from a dinner with investors and wants a live map of customer activity on the home screen in time for next week's meeting. 'It only needs to look good.'",
    ticket: {
      key: "live-activity-map",
      type: "ceo_request",
      by: "ceo",
      title: "Live activity map for the investor demo",
      description:
        "An animated world map on the home screen showing customer activity in real time, ready for next week's investor meeting.",
      trap: "vanity",
      value: [8, 16],
      effort: [5, 8],
      debt: [4, 7],
      signals: { hint: "It only needs to look good." },
      moves: [],
      why: "Built to impress in one meeting. It does nothing for customers and it would push out work that does.",
    },
    guidance:
      "Say no with a trade-off, not with a refusal: show exactly what would leave the sprint to make room, and offer a mock-up or a recorded demo instead. Seniority of the requester does not change the value of the ticket.",
  },
];
