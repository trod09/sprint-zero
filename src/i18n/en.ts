import type { Difficulty, ModuleStatus, Skill } from "@/core/case-engine";
import type { MoscowBucket } from "@/modules/backlog/planning";
import type {
  DiscardReason,
  PlanningMethod,
  TicketType,
} from "@/modules/backlog/schema";

/**
 * UI copy. English is the only locale for now; adding one means adding a
 * sibling file with the same shape and selecting it in `getMessages`.
 */
export const en = {
  app: {
    name: "Sprint Zero",
    description:
      "Interactive product management simulations with deterministic scoring and AI feedback.",
  },
  nav: {
    modules: "Modules",
    toggleTheme: "Toggle light and dark theme",
    skipToContent: "Skip to content",
  },
  home: {
    eyebrow: "The PM practice gym",
    title: "Practice product management by doing.",
    subtitle:
      "Simulations with a hidden ground truth: prioritize a messy backlog, hunt down a metric drop, and see criterion by criterion why you got your score.",
    pillars: [
      {
        title: "Hidden ground truth",
        body: "Every case has a real answer you have to find, not an opinion to argue.",
      },
      {
        title: "Reproducible score",
        body: "Same case, same answer, same score. Computed by code, never by a model.",
      },
      {
        title: "Feedback that explains",
        body: "A full breakdown, the solution, and coaching notes on what to do differently.",
      },
    ],
    upNextTitle: "Up next",
    upNextSubtitle: "The first two simulations, currently being built.",
    comingSoonTitle: "On the roadmap",
    comingSoonSubtitle: "More ways to train every PM skill.",
  },
  module: {
    backToModules: "All modules",
    skills: "Skills trained",
    minutes: (minutes: number) => `~${minutes} min per case`,
    casesTitle: "Cases",
    emptyTitle: "Cases are on the way",
    emptyBody:
      "This simulation is being built. Its first cases will appear here as soon as they are ready.",
    comingSoonBody:
      "This simulation is on the roadmap. It will open here when it is ready.",
    startCase: "Open case",
  },
  caseView: {
    backToModule: (moduleName: string) => `Back to ${moduleName}`,
  },
  backlog: {
    backlogTitle: "Backlog",
    brief: {
      label: "Brief",
      capacity: "Sprint capacity",
      points: (points: number) => `${points} pts`,
      length: "Sprint length",
      weeks: (weeks: number) => `${weeks} ${weeks === 1 ? "week" : "weeks"}`,
      team: "Team",
      engineers: (count: number) => `${count} engineers`,
      activeUsers: "Active users",
      mrr: "MRR",
      baseline: "Where the product stands",
      activation: "Activation",
      retention: "90-day retention",
      nps: "NPS",
      techDebt: "Tech debt index",
      stakeholders: "Stakeholders",
      events: (count: number) =>
        count === 1
          ? "Something will happen mid-sprint. Leave yourself room to react."
          : `${count} things will happen mid-sprint. Leave yourself room to react.`,
    },
    methods: {
      label: "Prioritization method",
      names: {
        drag: "Drag",
        rice: "RICE",
        moscow: "MoSCoW",
      } satisfies Record<PlanningMethod, string>,
      hints: {
        drag: "Drag tickets into the sprint, or use the + button. Order matters: the team works from the top.",
        rice: "Estimate reach, impact and confidence for the tickets you are considering, then build the sprint from the ranking.",
        moscow:
          "Sort tickets into Must, Should, Could and Won't, then build the sprint from the buckets.",
      } satisfies Record<PlanningMethod, string>,
    },
    filters: {
      search: "Search tickets",
      searchPlaceholder: "Search by title or id",
      type: "Type",
      allTypes: "All types",
      requester: "Requester",
      allRequesters: "Everyone",
      clear: "Clear filters",
      showing: (shown: number, total: number) =>
        shown === total ? `${total} tickets` : `${shown} of ${total} tickets`,
    },
    types: {
      feature: "Feature",
      bug: "Bug",
      tech_debt: "Tech debt",
      sales_request: "Sales request",
      ceo_request: "CEO request",
    } satisfies Record<TicketType, string>,
    ticket: {
      points: (points: number) => `${points} pt${points === 1 ? "" : "s"}`,
      open: (id: string) => `Open details of ${id}`,
      add: (id: string) => `Add ${id} to the sprint`,
      remove: (id: string) => `Remove ${id} from the sprint`,
      moveUp: (id: string) => `Move ${id} up`,
      moveDown: (id: string) => `Move ${id} down`,
      dragHandle: (id: string) => `Drag ${id}`,
      inSprint: "In sprint",
      reachShort: (users: string) => `${users} users`,
      supportShort: (count: number) => `${count} tickets`,
      revenueShort: (amount: string) => `${amount} at risk`,
      claim: "Has a claim",
    },
    detail: {
      requestedBy: "Requested by",
      description: "Description",
      signals: "What we know",
      noSignals: "No data attached to this ticket.",
      reach: "Reach",
      reachValue: (users: string) => `${users} users per month`,
      supportTickets: "Support tickets",
      supportValue: (count: number) => `${count} in the last 30 days`,
      revenueAtRisk: "Revenue at risk",
      revenueValue: (amount: string) => `${amount} per year, as claimed`,
      claim: "The requester says",
      priorities: (name: string) => `What ${name} pushes for`,
      effort: "Effort",
      addToSprint: "Add to sprint",
      removeFromSprint: "Remove from sprint",
      setAsideTitle: "Leave it out",
      setAsideHint:
        "Flag tickets you are deliberately not doing. Your reasons are part of how your plan is judged.",
      duplicate: "Duplicate of",
      duplicatePlaceholder: "Pick the original ticket",
      markDuplicate: "Mark as duplicate",
      discardReason: "Reason",
      discardPlaceholder: "Pick a reason",
      discardNote: "Note (optional)",
      discardNotePlaceholder: "What would change your mind?",
      discard: "Discard",
      markedDuplicate: (id: string) => `Marked as a duplicate of ${id}.`,
      markedDiscard: (reason: string) => `Discarded: ${reason}.`,
      restore: "Restore to backlog",
    },
    discardReasons: {
      single_customer: "Only one customer needs it",
      no_evidence: "No evidence behind the claim",
      no_impact: "Does not move a metric that matters",
      too_expensive: "Not worth its cost",
      not_now: "Valid, but not this sprint",
    } satisfies Record<DiscardReason, string>,
    setAside: {
      title: "Set aside",
      empty: "Tickets you mark as duplicate or discard appear here.",
      duplicateBadge: (id: string) => `Duplicate of ${id}`,
      discardBadge: "Discarded",
    },
    rice: {
      reach: "Reach",
      impact: "Impact",
      confidence: "Confidence",
      score: "Score",
      notScored: "—",
      unset: "Not set",
      reachLevels: [
        "Reach 1%",
        "Reach 5%",
        "Reach 20%",
        "Reach 50%",
        "Reach 90%",
      ],
      impactLevels: [
        "Impact ×0.25",
        "Impact ×0.5",
        "Impact ×1",
        "Impact ×2",
        "Impact ×3",
      ],
      confidenceLevels: ["Conf. 50%", "Conf. 80%", "Conf. 100%"],
      build: "Build sprint from ranking",
      buildHint: (count: number) =>
        count === 0
          ? "Score at least one ticket to build a sprint."
          : `${count} ticket${count === 1 ? "" : "s"} scored. Building replaces the current sprint.`,
    },
    moscow: {
      buckets: {
        must: "Must",
        should: "Should",
        could: "Could",
        wont: "Won't",
      } satisfies Record<MoscowBucket, string>,
      unsorted: "Not sorted yet",
      label: (id: string) => `MoSCoW bucket for ${id}`,
      build: "Build sprint from buckets",
      buildHint: (count: number) =>
        count === 0
          ? "Put at least one ticket in Must, Should or Could."
          : "Must first, then Should, then Could, while capacity lasts. Building replaces the current sprint.",
    },
    sprint: {
      title: "Sprint",
      dropHere: "Drag tickets here, or use the + button on a ticket.",
      capacity: (used: number, capacity: number) => `${used} / ${capacity} pts`,
      capacityLabel: "Sprint capacity used",
      over: (points: number, spilled: number) =>
        `Over capacity by ${points} pts. The last ${spilled === 1 ? "ticket" : `${spilled} tickets`} will not get done.`,
      full: "The sprint is full.",
      left: (points: number) => `${points} pts left`,
      capacityLine: "Capacity line",
      clear: "Clear",
      commit: "Commit sprint",
    },
    commit: {
      title: "Commit this sprint?",
      body: (count: number, used: number, capacity: number) =>
        `${count} ticket${count === 1 ? "" : "s"}, ${used} of ${capacity} story points. Once committed, the plan is final.`,
      overWarning: (points: number) =>
        `You are ${points} pts over capacity. Tickets below the capacity line will not be finished.`,
      emptyWarning: "Your sprint is empty.",
      confirm: "Commit",
      cancel: "Keep planning",
      submitting: "Scoring…",
      failed:
        "Your plan could not be scored. Check your connection and try again.",
    },
    result: {
      title: "Sprint committed",
      scoreLabel: "Score",
      outOf: "/ 100",
      breakdown: "Breakdown",
      planAgain: "Plan again",
      backToCases: "Choose another case",
    },
    dnd: {
      instructions:
        "To pick up a ticket, press space or enter. Use the arrow keys to move it, space or enter to drop it, and escape to cancel.",
      pickedUp: (title: string) => `Picked up ${title}.`,
      over: (title: string, target: string) => `${title} is over ${target}.`,
      dropped: (title: string, target: string) =>
        `${title} was dropped on ${target}.`,
      cancelled: (title: string) => `Moving ${title} was cancelled.`,
      sprintZone: "the sprint",
      backlogZone: "the backlog",
    },
  },
  status: {
    available: "Available",
    in_development: "Up next",
    coming_soon: "Coming soon",
  } satisfies Record<ModuleStatus, string>,
  skills: {
    execution: "Execution",
    analytics: "Analytics",
    product_sense: "Product sense",
    communication: "Communication",
    strategy: "Strategy",
  } satisfies Record<Skill, string>,
  difficulty: {
    apm: "APM",
    pm: "PM",
    senior: "Senior",
  } satisfies Record<Difficulty, string>,
  notFound: {
    title: "Page not found",
    body: "This page does not exist or has moved.",
    cta: "Back to modules",
  },
  footer: {
    note: "Scores are deterministic. AI feedback complements the score and never changes it.",
  },
};

export type Messages = typeof en;
