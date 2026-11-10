import type { Difficulty, ModuleStatus, Skill } from "@/core/case-engine";
import type { MoscowBucket } from "@/modules/backlog/planning";
import type {
  DiscardReason,
  EventType,
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
    library: "Case library",
    history: "History",
    skills: "Skills",
    toggleTheme: "Toggle light and dark theme",
    skipToContent: "Skip to content",
  },
  home: {
    eyebrow: "The PM practice gym",
    title: "Practice product management by doing.",
    subtitle:
      "Simulations with a hidden ground truth: prioritize a messy backlog, hunt down a metric drop, call an A/B test, and see criterion by criterion why you got your score.",
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
    upNextTitle: "Simulations",
    upNextSubtitle:
      "Open the ones that are ready. The next ones are being built.",
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
      newBadge: "New",
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
      confirmReplan: "Confirm replanned sprint",
    },
    events: {
      types: {
        production_outage: "Production incident",
        sales_promise: "Sales escalation",
        dev_unavailable: "Team change",
        compliance_deadline: "Legal deadline",
        ceo_escalation: "CEO request",
      } satisfies Record<EventType, string>,
      dialogTitle: (count: number) =>
        count === 1
          ? "Day 4 of the sprint: something happened"
          : `Day 4 of the sprint: ${count} things happened`,
      dialogBody:
        "Your sprint is under way, and the plan no longer matches reality. Replan with what you know now, then confirm.",
      capacityChange: (points: number) =>
        `${points} pts of capacity for the rest of the sprint`,
      newTicket: (id: string) => `New ticket in the backlog: ${id}`,
      replan: "Replan the sprint",
      bannerTitle: "Mid-sprint",
      bannerCapacity: (before: number, after: number) =>
        `Capacity: ${before} → ${after} pts`,
      reopen: "Show what happened",
      changes: (added: number, removed: number) =>
        added === 0 && removed === 0
          ? "No changes since you committed."
          : `Since you committed: ${added} added, ${removed} removed.`,
    },
    commit: {
      replanTitle: "Confirm the replanned sprint?",
      replanBody: (count: number, used: number, capacity: number) =>
        `${count} ticket${count === 1 ? "" : "s"}, ${used} of ${capacity} story points. This is the sprint your team delivers.`,
      revealing: "Starting the sprint…",
      title: "Commit this sprint?",
      body: (count: number, used: number, capacity: number) =>
        `${count} ticket${count === 1 ? "" : "s"}, ${used} of ${capacity} story points. Once committed, the sprint starts.`,
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
    results: {
      insight: "What this case was testing",
      principle: "Principle",
      sprintComparison: "Your sprint vs. the best sprint",
      yourSprint: "Your sprint",
      bestSprint: "Best possible sprint",
      valueOf: (value: number, effort: number, capacity: number) =>
        `${value} value · ${effort} / ${capacity} pts`,
      notFinished: "Not finished: over capacity",
      inBoth: "In both",
      onlyYours: "Not in the best sprint",
      missed: "Missed",
      value: (value: number) => `value ${value}`,
      metrics: "Metrics after the sprint",
      metricNames: {
        activation: "Activation",
        retention: "90-day retention",
        nps: "NPS",
        revenue: "MRR",
        techDebt: "Tech debt index",
      },
      stakeholders: "Stakeholder satisfaction",
      requestsDelivered: (done: number, total: number) =>
        `${done} of ${total} requests delivered`,
      noRequests: "Asked for nothing this sprint",
      traps: "Traps",
      trapNames: {
        none: "None",
        duplicate: "Duplicate",
        single_customer: "Single customer",
        hidden_critical_bug: "Hidden critical bug",
        vanity: "Vanity",
        low_evidence: "Low evidence",
      },
      trapOutcomes: {
        identified: "Named it",
        avoided: "Left it out",
        fell_for: "Fell for it",
      },
      criticals: "Critical tickets",
      disguised: "Filed as minor",
      delivered: "Delivered",
      notDelivered: "Not delivered",
      events: "Mid-sprint events",
      handling: (percent: number) => `Handled ${percent}%`,
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
  metricDrop: {
    metrics: {
      dau: "Daily active users",
      signups: "New signups",
      activation: "Activation rate",
      sessions: "Sessions",
      conversion: "Conversion rate",
    },
    dimensions: {
      platform: "Platform",
      appVersion: "App version",
      country: "Country",
      channel: "Acquisition channel",
      userType: "User type",
    },
    values: {
      ios: "iOS",
      android: "Android",
      web: "Web",
      US: "United States",
      GB: "United Kingdom",
      DE: "Germany",
      BR: "Brazil",
      IN: "India",
      organic: "Organic",
      paid_search: "Paid search",
      paid_social: "Paid social",
      referral: "Referral",
      new: "New users",
      returning: "Returning users",
    } as Record<string, string>,
    categories: {
      bug: "Bug or broken release",
      marketing: "Marketing or acquisition change",
      seasonality: "Seasonality or calendar",
      product: "Product or design change",
      external: "External: partner, provider or market",
    },
    annotationKinds: {
      release: "Release",
      campaign: "Campaign",
      holiday: "Holiday",
      incident: "Incident",
      experiment: "Experiment",
    },
    brief: {
      label: "The question",
      timeline: "What happened recently",
      day: (date: string) => date,
    },
    dashboard: {
      title: "Dashboard",
      metric: "Metric",
      breakdown: "Break down by",
      noBreakdown: "No breakdown",
      filters: "Filters",
      any: {
        platform: "Any platform",
        appVersion: "Any version",
        country: "Any country",
        channel: "Any channel",
        userType: "Any user type",
      },
      clearFilters: "Clear filters",
      range: "Range",
      ranges: { 30: "Last 30 days", 60: "Last 60 days", all: "All" },
      loading: "Loading…",
      failed: "This view could not be loaded. Try again.",
      total: "Total",
      lastWeek: "Last 7 days",
      previousWeek: "Previous 7 days",
      change: "Change",
      weekOverWeek: (before: string, after: string, change: string) =>
        `Last 7 days vs. the 7 before: ${before} → ${after} (${change})`,
      segment: "Segment",
      chartLabel: (metric: string) => `${metric} over time`,
      annotationsShown: "Dashed lines mark events on the timeline.",
    },
    log: {
      title: "Your investigation",
      empty: "Every view you open is recorded here.",
      count: (count: number) => `${count} view${count === 1 ? "" : "s"}`,
      restore: (index: number) => `Open view ${index} again`,
      by: (dimension: string) => `by ${dimension.toLowerCase()}`,
      where: "where",
    },
    diagnosis: {
      title: "Your diagnosis",
      intro:
        "Name where the drop comes from, what kind of cause it is, and what to do next.",
      dimension: "Affected dimension",
      value: "Affected value",
      pickDimension: "Pick a dimension",
      pickValue: "Pick a value",
      category: "Kind of cause",
      pickCategory: "Pick a kind of cause",
      action: "Next step",
      justification: "Why (optional)",
      justificationPlaceholder: "What in the data convinced you? Numbers help.",
      submit: "Submit diagnosis",
      confirmTitle: "Submit this diagnosis?",
      confirmBody:
        "Your diagnosis and the views you opened will be scored. You cannot change them afterwards.",
      confirm: "Submit",
      cancel: "Keep investigating",
      submitting: "Scoring…",
      failed:
        "Your diagnosis could not be scored. Check your connection and try again.",
    },
    results: {
      rootCause: "What actually happened",
      yourDiagnosis: "Your diagnosis vs. the answer",
      yours: "You said",
      answer: "Answer",
      segment: "Segment",
      category: "Kind of cause",
      action: "Next step",
      idealPath: "The direct path",
      investigation: (views: number, step: number | null) =>
        step === null
          ? `You opened ${views} view${views === 1 ? "" : "s"} and never looked at the right dimension.`
          : `You opened ${views} view${views === 1 ? "" : "s"} and first looked at the right dimension on view ${step}.`,
      falseLeads: "False leads",
      youChoseThis: "You chose this",
    },
  },
  abTest: {
    issues: {
      srm: {
        label: "Sample ratio mismatch",
        hint: "The split between arms is not the one planned.",
      },
      novelty: {
        label: "Novelty effect",
        hint: "The effect fades as users get used to the change.",
      },
      simpson: {
        label: "Simpson's paradox",
        hint: "Segments and the total point in opposite directions.",
      },
      guardrail: {
        label: "Guardrail breach",
        hint: "A metric that must not get worse got worse.",
      },
      underpowered: {
        label: "Not enough data",
        hint: "Too few users to detect the effect the test was planned for.",
      },
    },
    effects: {
      improves: "It really improves the primary metric",
      no_effect: "It has no real effect",
      harms: "It really hurts the primary metric",
      inconclusive: "Cannot tell from this data",
    },
    decisions: {
      ship: { label: "Ship", hint: "Roll it out to everyone." },
      iterate: {
        label: "Iterate",
        hint: "Do not roll out yet: fix the test or the design, or keep it running.",
      },
      kill: { label: "Kill", hint: "Stop and drop this version." },
    },
    views: {
      scorecard: "Scorecard",
      over_time: "Over time",
      segments: "Segments",
    },
    brief: {
      label: "The ask",
      design: "Experiment design",
      change: "What changed",
      hypothesis: "Hypothesis",
      primaryMetric: "Primary metric",
      guardrails: "Guardrails",
      tolerance: (percent: number, down: boolean) =>
        `Must not ${down ? "rise" : "fall"} more than ${percent}%`,
      overConverters: "Measured over converters",
      plan: "Plan",
      split: (treatment: number) =>
        `${100 - treatment}/${treatment} split (control/treatment)`,
      duration: (days: number) => `${days} days`,
      sample: (users: string, mde: string) =>
        `${users} users per arm to detect a ${mde} lift (80% power, 5% significance)`,
    },
    readout: {
      title: "Results",
      tabs: "Result views",
      users: "Users",
      control: "Control",
      treatment: "Treatment",
      split: "Share of users",
      planned: "Planned",
      daysRun: (days: number, planned: number) =>
        `Ran ${days} of ${planned} planned days`,
      metric: "Metric",
      change: "Relative change",
      interval: "95% CI",
      pValue: "p-value",
      primary: "Primary",
      guardrail: "Guardrail",
      significant: "Significant at 5%",
      notSignificant: "Not significant",
      better: "better",
      worse: "worse",
      overTimeTitle: "Lift over time",
      overTimeIntro:
        "Relative difference between treatment and control in the primary metric, each day and cumulatively.",
      dailyLift: "Daily lift",
      cumulativeLift: "Cumulative lift",
      dayLabel: (day: number) => `Day ${day}`,
      chartLabel: "Daily and cumulative lift of the primary metric",
      firstWeek: "First 7 days",
      lastWeek: "Last 7 days",
      segmentsTitle: (dimension: string) =>
        `Primary metric by ${dimension.toLowerCase()}`,
      segmentsIntro:
        "Each segment compared separately, with its share of users in treatment.",
      segment: "Segment",
      treatmentShare: "In treatment",
      all: "All users",
    },
    decision: {
      title: "Your call",
      intro:
        "Flag what is wrong with the readout, judge the real effect and decide.",
      issues: "Problems in this readout",
      issuesHint: "Leave all unchecked if the readout is trustworthy.",
      noIssues: "No problems flagged: you trust this readout.",
      effect: "Real effect on the primary metric",
      decision: "Decision",
      justification: "Why (optional)",
      justificationPlaceholder: "Which numbers drove your call?",
      submit: "Submit decision",
      confirmTitle: "Submit this decision?",
      confirmBody:
        "Your flags, your read of the effect and your decision will be scored. You cannot change them afterwards.",
      confirm: "Submit",
      cancel: "Keep reading",
      submitting: "Scoring…",
      failed:
        "Your decision could not be scored. Check your connection and try again.",
    },
    results: {
      truth: "What was really going on",
      yourCall: "Your call vs. the answer",
      yours: "You said",
      answer: "Answer",
      decision: "Decision",
      effect: "Real effect",
      problems: "Problems",
      none: "None",
      problemsTitle: "Problem by problem",
      statuses: {
        found: "Found",
        missed: "Missed",
        false_alarm: "False alarm",
        acceptable: "Fair flag",
        clear: "Not present",
      },
      recommendation: "What a strong analyst would do",
      notPresent:
        "This problem is not in the data: flagging it would have sent the team after the wrong fix.",
    },
  },
  triage: {
    sources: {
      app_review: "App review",
      support: "Support ticket",
      nps: "NPS comment",
    },
    severities: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    },
    brief: {
      label: "The ask",
      period: (from: string, to: string) => `${from} to ${to}`,
      counts: (total: number) => `${total} items`,
    },
    inbox: {
      title: "Inbox",
      show: "Show",
      unsorted: (count: number) => `Unsorted (${count})`,
      all: (count: number) => `All (${count})`,
      allSources: "All sources",
      search: "Search feedback",
      searchPlaceholder: "Search…",
      newestFirst: "Newest first",
      oldestFirst: "Oldest first",
      order: "Order",
      empty: "Nothing here. Change the filters to see more.",
      allSorted: "Every item is sorted. Review your clusters and submit.",
      select: (id: string) => `Select ${id}`,
      selected: (count: number) => `${count} selected`,
      moveSelected: "Move to",
      move: "Move",
      newClusterFromSelection: "New cluster from selection",
      clearSelection: "Clear",
      moveItem: (id: string) => `Move ${id}`,
      dragHandle: (id: string) => `Drag ${id} to a cluster`,
      stars: (rating: number) => `${rating} out of 5 stars`,
      nps: (score: number) => `NPS ${score}`,
      unsortedOption: "Unsorted",
      noiseOption: "Noise",
      inCluster: (name: string) => `In ${name}`,
      inNoise: "Set aside as noise",
    },
    clusters: {
      title: "Themes",
      intro:
        "Create a cluster per theme and drag feedback into it. Order them by importance; the first matters most.",
      newName: "New theme name",
      newPlaceholder: "e.g. Checkout errors",
      add: "Add",
      full: (max: number) => `You can create up to ${max} clusters.`,
      empty: "No clusters yet. Name your first theme above.",
      items: (count: number) => `${count} item${count === 1 ? "" : "s"}`,
      rename: (name: string) => `Rename ${name}`,
      moveUp: (name: string) => `Move ${name} up`,
      moveDown: (name: string) => `Move ${name} down`,
      remove: (name: string) => `Remove ${name}`,
      critical: "Critical",
      markCritical: (name: string) => `Flag ${name} as the critical problem`,
      show: (name: string) => `Show items in ${name}`,
      hide: (name: string) => `Hide items in ${name}`,
      opportunity: "Opportunity",
      opportunityPlaceholder: "How might we…?",
      dropHere: "Drop feedback here",
      unassign: (id: string) => `Move ${id} back to unsorted`,
      noise: "Noise",
      noiseIntro:
        "Praise, spam and off-topic messages that belong in no theme.",
      rank: (position: number) => `#${position}`,
    },
    dnd: {
      instructions:
        "To pick up a feedback item, press space or enter. Use the arrow keys to move it over a cluster, then press space or enter to drop it, or escape to cancel.",
      pickedUp: (item: string) => `Picked up ${item}.`,
      over: (item: string, target: string) => `${item} is over ${target}.`,
      dropped: (item: string, target: string) => `${item} moved to ${target}.`,
      cancelled: (item: string) => `Stopped dragging ${item}.`,
    },
    submit: {
      button: "Submit triage",
      needsCluster: "Put feedback in at least one cluster to submit.",
      confirmTitle: "Submit this triage?",
      confirmBody:
        "Your clusters, their order, the critical flag and your opportunities will be scored. You cannot change them afterwards.",
      unsortedWarning: (count: number) =>
        `${count} item${count === 1 ? " is" : "s are"} still unsorted and will count as missed.`,
      noCritical: "You have not flagged a critical problem.",
      confirm: "Submit",
      cancel: "Keep triaging",
      submitting: "Scoring…",
      failed:
        "Your triage could not be scored. Check your connection and try again.",
      reset: "Start over",
    },
    results: {
      ranking: "The real themes, by importance",
      severity: "Severity",
      items: "Items",
      yourCluster: "Your best matching cluster",
      noMatch: "No matching cluster",
      match: (percent: number) => `${percent}% match`,
      critical: "Critical problem",
      explanation: "Why this order",
      example: "An opportunity a strong PM would write",
      principle: "Principle",
      noise: (setAside: number, total: number) =>
        `Noise set aside: ${setAside} of ${total}`,
      atRank: (rank: number) => `ranked #${rank}`,
    },
  },
  ux: {
    issues: {
      contrast: {
        label: "Low contrast",
        hint: "Text that is hard to read against its background.",
      },
      hierarchy: {
        label: "Weak hierarchy",
        hint: "Nothing shows what matters most or where to start.",
      },
      cta: {
        label: "Confusing call to action",
        hint: "Buttons that compete or do not say what they do.",
      },
      long_form: {
        label: "Too many fields",
        hint: "Asks for more than the task needs.",
      },
      feedback: {
        label: "No feedback",
        hint: "An action gives no sign of what happened.",
      },
      labels: {
        label: "Missing labels",
        hint: "Fields, icons or controls with no visible name.",
      },
      destructive: {
        label: "Unsafe destructive action",
        hint: "Easy to delete or lose something by mistake.",
      },
      copy: {
        label: "Unclear wording",
        hint: "Jargon or text the user cannot understand.",
      },
    },
    brief: {
      label: "The ask",
      goal: "The user's goal",
    },
    modes: {
      label: "Mode",
      use: "Use the screen",
      mark: "Mark problems",
      useHint: "Click, type and try things like a customer would.",
      markHint: "Click any part of the screen to report a problem there.",
    },
    frame: {
      label: (product: string) => `${product} screen`,
      mark: (region: string) => `Mark a problem in: ${region}`,
      findings: (count: number) => `${count} finding${count === 1 ? "" : "s"}`,
    },
    finding: {
      title: "Report a problem",
      region: "Where",
      pickRegion: "Click a part of the screen in Mark mode.",
      type: "Kind of problem",
      pickType: "Pick a kind of problem",
      note: "What you saw (optional)",
      notePlaceholder: "Who does it hurt, and how?",
      add: "Add finding",
      cancel: "Cancel",
    },
    findings: {
      title: "Your findings",
      empty:
        "No findings yet. Switch to Mark mode and click a part of the screen.",
      remove: (region: string, type: string) => `Remove ${type} in ${region}`,
      max: (max: number) => `You can report up to ${max} findings.`,
    },
    submit: {
      button: "Submit critique",
      confirmTitle: "Submit this critique?",
      confirmBody:
        "Your findings will be scored: each real problem found counts for you, and each part of the screen flagged by mistake counts against you.",
      confirm: "Submit",
      cancel: "Keep looking",
      submitting: "Scoring…",
      failed:
        "Your critique could not be scored. Check your connection and try again.",
    },
    results: {
      planted: "The problems in this screen",
      outcomes: {
        found: "Found",
        wrong_type: "Found, wrong kind",
        missed: "Missed",
      },
      youSaid: (type: string) => `You called it: ${type}`,
      fix: "Fix",
      falseAlarms: "False alarms",
      falseAlarmsIntro: "These parts of the screen work as intended.",
      noFalseAlarms: "No false alarms.",
      screen: "The screen, with the problems marked",
      principle: "Principle",
    },
  },
  generate: {
    title: "Generate a new case",
    intro:
      "Pick an industry and a level, and get a case nobody has played before. Same code and rules, so the score is just as reproducible.",
    industry: "Industry",
    difficulty: "Level",
    industries: {
      fintech: "Fintech",
      marketplace: "Marketplace",
      saas: "SaaS B2B",
      consumer: "Consumer",
    },
    button: "Generate",
    generating: "Generating…",
    note: "The case link contains its seed: share it and others get exactly the same case.",
    generatedLabel: (module: string, industry: string, level: string) =>
      `Generated ${module} case · ${industry} · ${level}`,
  },
  library: {
    title: "Case library",
    subtitle: "Every playable case, with your best score so far.",
    filters: "Filter cases",
    module: "Module",
    allModules: "All modules",
    industry: "Industry",
    allIndustries: "All industries",
    difficulty: "Difficulty",
    allDifficulties: "All levels",
    status: "Status",
    allStatuses: "Played or not",
    completed: "Played",
    notCompleted: "Not played yet",
    clear: "Clear filters",
    count: (shown: number, total: number) =>
      shown === total ? `${total} cases` : `${shown} of ${total} cases`,
    empty: "No case matches these filters.",
    best: (score: number) => `Best ${score}`,
    open: (title: string) => `Open case: ${title}`,
  },
  history: {
    title: "History",
    subtitle:
      "Your attempts are saved in this browser. Results are recomputed from your answers, so they always match the current scoring.",
    empty: "You have not finished a case yet.",
    emptyCta: "Browse cases",
    played: (count: number) => `${count} attempt${count === 1 ? "" : "s"}`,
    average: (score: number) => `Average ${score}`,
    viewResults: "View results",
    unknownCase: "Case no longer available",
    delete: "Delete",
    deleteLabel: (title: string) => `Delete attempt on ${title}`,
    clearAll: "Clear history",
    clearTitle: "Clear your whole history?",
    clearBody:
      "Every attempt saved in this browser will be deleted. This cannot be undone.",
    clearConfirm: "Clear history",
    cancel: "Cancel",
    loading: "Loading your history…",
  },
  skillsPage: {
    title: "Your skills",
    subtitle:
      "An Elo-style rating per skill, built from your first attempt at each case. Harder cases move it more; replays do not count, because you already know the answer.",
    loading: "Loading your skills…",
    empty: "Finish a case to see your skill radar.",
    emptyCta: "Browse cases",
    radarTitle: "Skill radar",
    radarLabel: "Level per skill, from 0 to 100",
    level: "Level",
    rating: "Rating",
    attempts: (count: number) =>
      count === 0
        ? "Not practiced yet"
        : `${count} case${count === 1 ? "" : "s"}`,
    noModule: "No playable module trains this skill yet.",
    trendTitle: "Over time",
    trendLabel: "Rating per skill after each case",
    trendEmpty: "Your ratings over time appear after your first case.",
    caseNumber: (index: number) => (index === 0 ? "Start" : `Case ${index}`),
    nextTitle: "Practice next",
    nextIntro:
      "Unplayed cases for your weakest skills, at a difficulty that stretches you.",
    nextEmpty:
      "You have played every case that trains these skills. New cases are on the way.",
    reasons: {
      not_practiced: (skill: string) =>
        `You have not practiced ${skill.toLowerCase()} yet.`,
      weakest: (skill: string) => `${skill} is one of your weakest skills.`,
    },
    play: "Play",
    howTitle: "How the rating works",
    how: "Every skill starts at 1000. An APM case is rated 1000, PM 1200 and Senior 1400. Scoring above what your rating predicts against the case raises it, scoring below lowers it. A module counts fully for its first skill and half for the others. The level on the radar maps 800 to 0 and 1600 to 100.",
  },
  errors: {
    title: "Something went wrong",
    body: "This page could not be displayed. Try again, or go back to the modules.",
    retry: "Try again",
  },
  results: {
    loading: "Loading your results…",
    missingTitle: "This attempt is not in this browser",
    missingBody:
      "Results are saved in the browser where you played. Open them there, or play the case again.",
    errorTitle: "Your results could not be loaded",
    errorBody: "Check your connection and reload the page.",
    retry: "Play this case again",
    backToModule: (moduleName: string) => `Back to ${moduleName}`,
    score: "Score",
    outOf: "/ 100",
    breakdown: "Score breakdown",
    playedOn: (date: string) => `Submitted ${date}`,
    feedback: {
      title: "AI coach",
      intro:
        "Qualitative feedback on your decisions. It explains your score and never changes it.",
      request: "Get feedback",
      requesting: "Writing feedback…",
      summary: "Summary",
      strengths: "What you did well",
      improvements: "What to improve",
      principle: "Principle to remember",
      notConfigured:
        "AI feedback is not available on this server yet. Everything else on this page is computed by code.",
      failed:
        "The AI coach could not write feedback this time. Try again later.",
      retry: "Try again",
      model: (model: string) => `Written by ${model}`,
    },
  },
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
