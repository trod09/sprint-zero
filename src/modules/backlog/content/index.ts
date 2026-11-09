/**
 * Entry point to the content bank: which tickets, events and names are
 * available for a given industry.
 */
import { companies } from "./companies";
import { consumerTickets } from "./consumer";
import { eventTemplates } from "./events";
import { fintechTickets } from "./fintech";
import { genericTickets } from "./generic";
import { marketplaceTickets } from "./marketplace";
import { saasTickets } from "./saas";
import type {
  CompanyTemplate,
  EventTemplate,
  Industry,
  TicketTemplate,
} from "./types";

export { companies };
export { INDUSTRIES, ROLE_KEYS } from "./types";
export type * from "./types";

const INDUSTRY_TICKETS: Record<Industry, readonly TicketTemplate[]> = {
  fintech: fintechTickets,
  marketplace: marketplaceTickets,
  saas: saasTickets,
  consumer: consumerTickets,
};

/**
 * Generic tickets that read wrong in an industry: they talk about sales
 * calls, seats or renewals that the business model does not have.
 */
const GENERIC_EXCLUSIONS: Record<Industry, readonly string[]> = {
  fintech: [],
  saas: [],
  marketplace: [
    "csv-export",
    "invite-teammates",
    "card-update-fails",
    "audit-log",
    "usage-report",
    "saml-sso",
    "crit-upgrade-fails",
    "sc-report-template",
    "sc-on-premise",
    "sc-cost-center-field",
    "sc-white-label",
    "le-integrations-marketplace",
  ],
  consumer: [
    "hc-wrong-account-name",
    "csv-export",
    "slow-home",
    "invite-teammates",
    "audit-log",
    "bulk-actions",
    "usage-report",
    "saml-sso",
    "sc-report-template",
    "sc-on-premise",
    "sc-cost-center-field",
    "sc-white-label",
    "le-integrations-marketplace",
  ],
};

export function ticketPool(industry: Industry): TicketTemplate[] {
  const excluded = new Set(GENERIC_EXCLUSIONS[industry]);
  return [
    ...genericTickets.filter((template) => !excluded.has(template.key)),
    ...INDUSTRY_TICKETS[industry],
  ];
}

export function eventPool(industry: Industry): EventTemplate[] {
  return eventTemplates.filter(
    (template) =>
      !template.industries || template.industries.includes(industry),
  );
}

export function getCompany(key: string): CompanyTemplate {
  const company = companies.find((candidate) => candidate.key === key);
  if (!company) throw new Error(`Unknown company template "${key}"`);
  return company;
}

/** Every ticket template, including the ones attached to events. */
export function allTicketTemplates(): TicketTemplate[] {
  return [
    ...genericTickets,
    ...Object.values(INDUSTRY_TICKETS).flat(),
    ...eventTemplates.flatMap((event) => (event.ticket ? [event.ticket] : [])),
  ];
}

export { eventTemplates, GENERIC_EXCLUSIONS };

/** First names for stakeholders and engineers. */
export const FIRST_NAMES: readonly string[] = [
  "Laura",
  "Marta",
  "Diego",
  "Priya",
  "Tomás",
  "Aisha",
  "Jonas",
  "Mei",
  "Rafael",
  "Ingrid",
  "Kofi",
  "Elena",
  "Mateo",
  "Yuki",
  "Hannah",
  "Omar",
  "Sofia",
  "Luca",
  "Nadia",
  "Andrés",
  "Chloe",
  "Samir",
  "Irene",
  "Viktor",
  "Amara",
  "Pablo",
  "Leila",
  "Erik",
  "Carmen",
  "Daniel",
];

/** Fictional organisations used as the "one big customer" in requests. */
export const CUSTOMER_NAMES: readonly string[] = [
  "Northwind Logistics",
  "Halvorsen Group",
  "Brightline Retail",
  "Meridian Health",
  "Castellan Foods",
  "Oakridge Partners",
  "Vantage Motors",
  "Solstice Hotels",
  "Kestrel Insurance",
  "Arbor & Finch",
  "Pinnacle Freight",
  "Greyfield Energy",
];
