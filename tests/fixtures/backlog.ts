/** Builders for small hand-made Backlog Simulator data in tests. */
import type { Ticket } from "@/modules/backlog/schema";

export interface TicketOptions {
  effort?: number;
  value?: number;
  critical?: boolean;
  trap?: Ticket["hidden"]["trap"];
  duplicateOf?: string;
}

export function makeTicket(id: string, options: TicketOptions = {}): Ticket {
  const trap = options.trap ?? (options.duplicateOf ? "duplicate" : "none");
  return {
    id,
    title: `Ticket ${id}`,
    description: "A ticket used in tests.",
    type: "feature",
    requester: "Eng – Test",
    stakeholderId: "engineering",
    effort: options.effort ?? 3,
    visible: {},
    hidden: {
      trueValue: options.value ?? 50,
      trap,
      ...(options.duplicateOf ? { duplicateOf: options.duplicateOf } : {}),
      critical: options.critical ?? false,
      debtImpact: 0,
      metricEffects: { activation: 0, retention: 0, nps: 0, revenue: 0 },
      explanation: "Because the test says so.",
    },
  };
}
