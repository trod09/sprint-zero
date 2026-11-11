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
    world: (n: number) => `World ${n}`,
    aboutTitle: "About this world",
    levels: {
      title: "Levels",
      zone: (n: number, level: string) => `Zone ${n} · ${level}`,
      cleared: (cleared: number, total: number) =>
        `${cleared}/${total} cleared`,
      new: "New",
      best: (score: number) => `Best ${score}/100`,
      notPlayed: "Not played yet",
      progressTitle: "Your progress",
      casesCleared: "Cases cleared",
      stars: "Stars",
      startHint: "Play any level to start collecting stars.",
      keepGoing: (left: number) =>
        left === 0
          ? "Every star collected. This world is cleared."
          : `${left} star${left === 1 ? "" : "s"} left to collect in this world.`,
    },
  },
  caseView: {
    backToModule: (moduleName: string) => `Back to ${moduleName}`,
  },
  backlog: {
    mission: {
      fill: "Fill the sprint",
      capacity: "Stay within capacity",
      commit: "Commit the sprint",
      replan: "Replan after the event",
      hint: "Add at least one ticket to the sprint.",
    },
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
      emptyTitle: "An empty sprint",
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
      emptyTitle: "No views yet",
      empty: "Every view you open is recorded here, so you can go back to it.",
      count: (count: number) => `${count} view${count === 1 ? "" : "s"}`,
      restore: (index: number) => `Open view ${index} again`,
      by: (dimension: string) => `by ${dimension.toLowerCase()}`,
      where: "where",
    },
    mission: {
      explore: "Explore 3 views",
      segment: "Name the segment",
      cause: "Name the cause",
      action: "Pick the next step",
      hint: "Name the segment, the cause and the next step to submit.",
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
    mission: {
      views: "Open every view",
      effect: "Judge the effect",
      decision: "Make the call",
      hint: "Judge the effect and pick a decision to submit.",
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
    mission: {
      themes: "Make 2 themes",
      sort: "Sort the inbox",
      critical: "Flag the critical one",
      opportunities: "Write opportunities",
    },
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
      emptyTitle: "No feedback matches",
      allSorted: "Every item is sorted. Review your clusters and submit.",
      allSortedTitle: "Inbox zero",
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
      empty: "Name your first theme above, then drag feedback into it.",
      emptyTitle: "No themes yet",
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
    mission: {
      mark: "Switch to Mark mode",
      first: "Report a problem",
      three: "Find 3 problems",
      notes: "Say what you saw",
      hint: "Report at least one problem to submit.",
    },
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
      emptyTitle: "No findings yet",
      title: "Your findings",
      empty:
        "Switch to Mark mode and click the part of the screen that has a problem.",
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
  productCase: {
    kinds: {
      design: "Product design",
      improvement: "Product improvement",
      strategy: "Strategy",
      estimation: "Estimation",
    },
    sources: {
      interviews: "Interviews",
      analytics: "Analytics",
      support: "Support",
      survey: "Survey",
      market: "Market",
    },
    brief: {
      question: "The question",
      context: "Context",
      research: "Research",
      researchIntro: "What the team knows. Ground your answer in it.",
    },
    timer: {
      start: (minutes: number) => `Start a ${minutes}-minute timer`,
      hint: "Practice under interview conditions. The timer never changes your score.",
      remaining: "Time left",
      over: "Time is up. Wrap up and submit, like you would in the room.",
      stop: "Stop timer",
    },
    steps: {
      label: "Steps",
      users: "Users",
      problems: "Problems",
      solutions: "Solutions",
      metrics: "Metrics",
      review: "Review",
      back: "Back",
      next: "Next",
      done: "done",
    },
    users: {
      title: "Who are you building for?",
      intro: "Pick the one segment you would focus on first.",
      why: "Why this segment?",
      whyPlaceholder: "What in the research makes this the right group?",
    },
    problems: {
      title: "Which problems matter most to them?",
      intro: (max: number) =>
        `Pick up to ${max} problems for the segment you chose.`,
      why: "Why these problems?",
      whyPlaceholder: "How often do they happen, and how much do they hurt?",
      max: (max: number) => `You can pick up to ${max}.`,
      noSegment: "Choose a segment first: problems are judged for it.",
    },
    solutions: {
      title: "What would you build, and in what order?",
      ideas: "Your own ideas (optional)",
      ideasPlaceholder:
        "Brainstorm before you look at the options: what would you try?",
      intro: (max: number) =>
        `Add up to ${max} options to your plan. The first one ships first.`,
      effort: "Effort",
      add: "Add to plan",
      inPlan: (position: number) => `#${position} in plan`,
      plan: "Your plan",
      planEmpty: "Nothing in the plan yet.",
      up: (name: string) => `Move ${name} up`,
      down: (name: string) => `Move ${name} down`,
      remove: (name: string) => `Remove ${name} from the plan`,
      why: "Why this order?",
      whyPlaceholder: "What does each option relieve, and at what cost?",
      efforts: { S: "Small", M: "Medium", L: "Large" },
    },
    metrics: {
      title: "How will you know it worked?",
      metric: "Metric",
      intro:
        "Pick one success metric and one guardrail: the harm you must not cause.",
      success: "Success",
      guardrail: "Guardrail",
      successFor: (name: string) => `Use ${name} as the success metric`,
      guardrailFor: (name: string) => `Use ${name} as the guardrail`,
      why: "Why these metrics?",
      whyPlaceholder: "What would you expect to see, and how soon?",
    },
    review: {
      title: "Review your answer",
      intro:
        "Only your choices are scored. Your reasoning goes to the AI coach.",
      missing: "Not chosen yet",
      edit: "Edit",
    },
    estimation: {
      mission: {
        facts: "Pick the facts",
        calculate: "Build the chain",
        estimate: "Give a number",
        approach: "Explain the approach",
      },
      answerTitle: "Your answer",
      calculatorEmptyTitle: "Nothing to multiply yet",
      facts: "Fact sheet",
      factsIntro:
        "Tick the facts your estimate needs. Not every fact belongs in it.",
      use: (label: string) => `Use: ${label}`,
      source: "Source",
      multipliers: "Constant factors",
      multipliersIntro:
        "Add factors that are not on the sheet, such as 12 months.",
      multiplierLabel: "What it is",
      multiplierValue: "Value",
      addMultiplier: "Add a factor",
      removeMultiplier: (label: string) => `Remove factor ${label}`,
      calculator: "Your calculation",
      calculatorEmpty: "Tick facts to multiply them here.",
      useResult: "Use this result",
      estimate: "Your estimate",
      estimateHint: (unit: string) => `In ${unit}. Round numbers are fine.`,
      approach: "Your approach",
      approachPlaceholder:
        "Which unit buys, and why each factor belongs in the chain.",
      sanity: "Sanity check",
      sanityPlaceholder: "Compare your result with something you already know.",
    },
    submit: {
      needsChoice: "Make at least one choice to submit.",
      button: "Submit answer",
      confirmTitle: "Submit this answer?",
      confirmBody:
        "Your choices will be scored against the ideal answer, and you will see why each option was better or worse.",
      confirm: "Submit",
      cancel: "Keep working",
      submitting: "Scoring…",
      failed:
        "Your answer could not be scored. Check your connection and try again.",
    },
    results: {
      ideal: "Ideal answer",
      yourChoice: "Your choice",
      best: "Best",
      picked: "You picked",
      judgedFor: (segment: string) => `Judged for ${segment}, your segment.`,
      judgedForProblems: (problems: string[]) =>
        `Relief is weighed for your problems: ${problems.join("; ")}`,
      fit: "Fit",
      severity: "Severity",
      rank: "Rank",
      priority: "Relief per effort",
      yourOrder: "Your order",
      notRanked: "—",
      successFit: "As success",
      guardrailFit: "As guardrail",
      principle: "Principle",
      timing: (used: string, limit: string) => `Timed: ${used} of ${limit}`,
      estimate: {
        title: "The estimate",
        yours: "Your estimate",
        answer: "Answer",
        off: (ratio: string) => `${ratio} the answer`,
        none: "No estimate",
        formula: "How it is built",
        trap: (value: string) =>
          `Starting from the wrong base gives ${value}, the most common mistake here.`,
        facts: "The fact sheet, explained",
        needed: "Needed",
        notNeeded: "Not needed",
        used: "You used it",
        constants: "Constants",
      },
    },
  },
  prd: {
    documentKinds: {
      memo: "Memo",
      data: "Data",
      email: "Email",
      notes: "Notes",
    },
    horizons: {
      six_weeks: "6 weeks",
      quarter: "1 quarter",
      half_year: "2 quarters",
      year: "1 year",
    },
    buckets: {
      v1: "Version 1",
      later: "Later",
      out: "Non-goal",
    },
    brief: {
      label: "The ask",
      feature: "Feature",
      documents: "Documents",
      documentsIntro: "Everything you need is here. Read it before you write.",
      from: (who: string) => `From ${who}`,
    },
    steps: {
      label: "Sections",
      problem: "Problem",
      goals: "Goals",
      scope: "Scope",
      risks: "Risks",
      questions: "Open questions",
      review: "Review",
      back: "Back",
      next: "Next",
      done: "done",
    },
    problem: {
      title: "Problem",
      statement: "Problem statement",
      statementPlaceholder:
        "Who has the problem, what happens to them, and what it costs. Two or three sentences.",
      evidence: "Evidence",
      evidenceIntro: (max: number) =>
        `Cite up to ${max} pieces of evidence that prove the problem is real.`,
      max: (max: number) => `You can cite up to ${max}.`,
    },
    goals: {
      title: "Goals and success metric",
      goals: "Goals",
      goalsPlaceholder:
        "What changes for users and for the business if this works?",
      metric: "Primary success metric",
      baseline: "Baseline",
      target: "Target",
      horizon: "Within",
      pickHorizon: "Pick a time frame",
      unit: (unit: string) => `In ${unit}`,
      invalid: "Enter a number.",
    },
    scope: {
      title: "Scope and non-goals",
      intro:
        "Put each requirement in version 1, later, or out of scope as a non-goal. The documents set the limits.",
      requirement: "Requirement",
      bucketFor: (bucket: string, requirement: string) =>
        `${bucket}: ${requirement}`,
      assigned: (done: number, total: number) => `${done} of ${total} placed`,
    },
    risks: {
      title: "Risks",
      intro: (max: number) =>
        `Name up to ${max} risks and how you would reduce each one.`,
      mitigation: "Mitigation",
      mitigationPlaceholder:
        "What will you do so it does not happen, or hurts less?",
      max: (max: number) => `You can name up to ${max}.`,
    },
    questions: {
      title: "Open questions",
      label: "Open questions",
      placeholder:
        "What do you still need to find out, and from whom? One per line.",
    },
    review: {
      title: "Your one-pager",
      intro:
        "This is what you will submit. Your choices are scored; your writing goes to the AI coach.",
      onePager: (feature: string) => `${feature}: one-pager`,
      empty: "Not written yet",
      edit: "Edit",
      evidence: "Evidence",
      metric: "Success metric",
      metricLine: (
        metric: string,
        baseline: string,
        target: string,
        horizon: string,
      ) => `${metric}: from ${baseline} to ${target} within ${horizon}`,
      unset: "?",
    },
    submit: {
      button: "Submit one-pager",
      confirmTitle: "Submit this one-pager?",
      confirmBody:
        "Your evidence, metric, scope and risks will be checked against the documents, and you will see the ideal one-pager.",
      confirm: "Submit",
      cancel: "Keep writing",
      submitting: "Scoring…",
      failed:
        "Your one-pager could not be scored. Check your connection and try again.",
    },
    results: {
      ideal: "Ideal one-pager",
      yours: "Yours",
      expected: "Belongs in",
      cited: "You cited it",
      named: "You named it",
      strength: "Strength",
      relevance: "Relevance",
      metricRows: {
        metric: "Metric",
        baseline: "Baseline",
        target: "Target",
        horizon: "Time frame",
      },
      answer: "Answer",
      targetRange: (min: string, max: string) => `${min} to ${max}`,
      none: "—",
      principle: "Principle",
    },
  },
  arcade: {
    mascotName: "Kanbo",
    mascotAlt: "Kanbo, a sticky note robot",
    sound: { on: "Sound on", off: "Sound off" },
    level: (level: number) => `LV ${level}`,
    levelLong: (level: number) => `Level ${level}`,
    xp: (xp: number) => `${xp.toLocaleString("en-US")} XP`,
    xpProgress: (into: number, needed: number) =>
      `${into.toLocaleString("en-US")} / ${needed.toLocaleString("en-US")} XP`,
    xpBarLabel: (level: number) => `Progress to level ${level + 1}`,
    stars: (count: number, max: number) => `${count} of ${max} stars`,
    world: (index: number) => `World ${index}`,
    locked: "Locked",
    player: {
      title: "Player",
      name: "Rookie PM",
      streak: (days: number) => `${days}-day streak`,
      streakShort: "Streak",
      totalXp: "Total XP",
      starsLabel: "Stars",
      badges: "Badges",
      badgeEarned: (name: string) => `${name}: earned`,
      badgeLocked: (name: string) => `${name}: locked`,
      chooseAvatar: "Choose your avatar",
      avatar: (id: string) => `Avatar ${id}`,
      loading: "Loading your progress…",
    },
    badges: {
      first_case: { name: "First case", hint: "Submit any case." },
      perfect: { name: "Perfect run", hint: "Score 100 on a case." },
      module_master: {
        name: "World master",
        hint: "Get three stars on every case of one module.",
      },
      streak_3: { name: "On a roll", hint: "Play three days in a row." },
      streak_7: { name: "Unstoppable", hint: "Play seven days in a row." },
      senior_clear: {
        name: "Senior material",
        hint: "Score 75 or more on a Senior case.",
      },
      explorer: { name: "Explorer", hint: "Play every module at least once." },
      generated: {
        name: "Fresh seed",
        hint: "Play a case you generated.",
      },
    },
    greeting: {
      first:
        "Hi, I'm Kanbo! Pick a world below and play your first case. I'll be in every brief with a tip.",
      back: (level: number) =>
        `Welcome back! You're level ${level}. One case a day keeps the streak alive.`,
    },
    tipLabel: "Kanbo's tip",
    tips: {
      backlog: [
        "Read every ticket before you drag. The trap tickets look urgent on purpose.",
        "Capacity is a hard limit. A full sprint of small wins can beat one big bet.",
        "When an event lands mid-sprint, re-plan from what you know now, not from your first plan.",
        "Duplicates and one-customer requests are cheap to spot if you compare titles.",
      ],
      "metric-drop": [
        "Before you blame anything, check whether the drop is real or a tracking change.",
        "Break the metric down one dimension at a time. The cause usually hides in one segment.",
        "A cause has to explain the timing too: when did it start, and what shipped that day?",
      ],
      "ab-test": [
        "Check the split first: if the groups are not the size you planned, nothing else can be trusted.",
        "Look at the lift day by day. A lift that fades is novelty, not value.",
        "A guardrail that gets worse can veto a winning primary metric.",
      ],
      "feedback-triage": [
        "Loud is not the same as important. Weigh reach by how much it hurts.",
        "Sort by date once: a critical problem is often new and still small.",
        "Praise and spam are noise. Set them aside so they don't bend your themes.",
      ],
      "ux-critique": [
        "Use the screen like a customer first, then switch to Mark mode.",
        "Name the problem by its effect on the user's goal, not by how it looks.",
        "False alarms cost points. If a part works, leave it alone.",
      ],
      "user-interview": [
        "Ask about the last time it happened. Stories beat opinions.",
        "'Would you use...?' gets a polite yes that means nothing.",
        "When an answer is vague, stay on it: 'What happened next?'",
        "If your question contains the answer you hope for, rewrite it.",
      ],
      "quick-cases": [
        "Do the arithmetic before you choose. The exhibits hold every number you need.",
        "The numbers change from case to case, and the right call changes with them.",
        "When you write to customers: what happened, what they must do, when they hear next.",
        "Ask what cannot move (a date, a law, a budget) and decide around it.",
      ],
      "roadmap-okrs": [
        "A key result is a number that moves when users behave differently. 'Launch X' is a task.",
        "Find the initiatives other squads wait for and schedule them first.",
        "Who asked for it is not a reason. Ask which objective it moves.",
        "A full timeline is not the goal: empty sprints beat work nobody needs.",
      ],
      "product-case": [
        "Pick one segment and say why. Everything after depends on it.",
        "Weigh relief against effort before you rank solutions.",
        "Each step builds on the last one: users, then problems, then what to build, then how to measure it.",
      ],
      "product-case-estimation": [
        "Start from the unit that buys: a household, a business, a trip.",
        "Before you multiply, check the fact is not already counted in another one.",
        "Percentages only hold for the group they were measured in.",
      ],
      "prd-writer": [
        "Every number in your one-pager should come from the documents.",
        "Non-goals are decisions. Write down what you will not do and why.",
        "A success metric needs a baseline, a target and a date.",
      ],
      default: [
        "Read the brief twice. The best answers come from details most people skip.",
      ],
    },
    steps: {
      done: "done",
      stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    },
    mission: {
      label: "Mission",
      objectives: "Objectives",
      progress: (done: number, total: number) =>
        `${done} of ${total} objectives done`,
      done: "done",
      next: (label: string) => `Next: ${label}`,
    },
    jumpBackIn: {
      title: "Jump back in",
      resume: "Resume",
      start: "Start",
      inProgress: "In progress",
      suggested: "Suggested next",
      empty: "Pick a world below to start your first case.",
      noDraft: "You opened this case recently.",
    },
    daily: {
      title: "Daily case",
      number: (n: number) => `#${n}`,
      intro: "One new case a day, the same for everyone.",
      play: "Play today's case",
      replay: "Play it again",
      done: (score: number) => `Done today: ${score}/100`,
      streak: (days: number) => `${days}-day daily streak`,
      next: (hours: number) =>
        hours <= 1
          ? "Next case in under an hour"
          : `Next case in ${hours} hours`,
    },
    worlds: {
      title: "Worlds",
      subtitle: "Each module is a world. Clear its cases to collect stars.",
      cases: (played: number, total: number) => `${played}/${total} cases`,
      enter: (name: string) => `Enter ${name}`,
      comingSoon: "Coming soon",
    },
    result: {
      complete: "Level complete!",
      cleared: "Level cleared",
      tryAgain: "Keep practicing",
      score: "Score",
      xpGained: "XP gained",
      replayNote: "Replays only add XP when you beat your best score.",
      levelUp: (level: number) => `Level up! You reached level ${level}.`,
      newBadge: "New badge",
      nextCase: "Next case",
      playAgain: "Play again",
      breakdown: "Breakdown",
    },
    styleguide: {
      title: "Styleguide",
      intro:
        "Every token and component of the arcade design system, in the current theme. Toggle the theme in the header to check both.",
      tokens: "Color tokens",
      modules: "Module colors",
      type: "Typography",
      buttons: "Buttons",
      badges: "Badges",
      cards: "Cards",
      forms: "Form controls",
      icons: "Pixel icons",
      game: "Game components",
      replay: "Replay animations",
      contrast: "Contrast (WCAG AA)",
      contrastIntro:
        "Measured from the tokens in this theme. Text needs 4.5:1; large text and UI parts need 3:1.",
      pair: "Pair",
      ratio: "Ratio",
      pass: "Pass",
      fail: "Fail",
    },
  },
  roadmap: {
    brief: {
      label: "The ask",
      objectives: "Company objectives",
      teams: "Teams",
      teamCapacity: (sprints: number) =>
        `${sprints} sprints, one initiative at a time`,
    },
    tabs: {
      label: "Steps",
      keyResults: "1. Key results",
      roadmap: "2. Roadmap",
      review: "3. Review",
    },
    keyResults: {
      intro: (max: number) =>
        `For each objective, choose the ${max} key results you would commit to. A good key result is a number that changes when users behave differently.`,
      picked: (count: number, max: number) => `${count} of ${max} chosen`,
    },
    board: {
      title: "Timeline",
      intro:
        "Give each initiative a start sprint. A team works on one initiative at a time, and an initiative cannot start until everything it needs is finished.",
      sprint: (n: number) => `Sprint ${n}`,
      sprintShort: (n: number) => `S${n}`,
      team: "Team",
      capacity: (used: number, total: number) => `${used}/${total} sprints`,
      overbooked: "overbooked",
      empty: "Nothing scheduled yet",
      initiatives: "Initiatives",
      effort: (sprints: number) =>
        `${sprints} sprint${sprints === 1 ? "" : "s"}`,
      requester: (who: string) => `Asked by ${who}`,
      needs: "Needs",
      start: "Start",
      startLabel: (title: string) => `Start sprint for ${title}`,
      notScheduled: "Not this quarter",
      placeNext: "Next free slot",
      remove: "Remove",
      status: {
        ok: "Ships this quarter",
        overflow: "Runs past the end of the quarter",
        overlap: "The team is busy with another initiative then",
        blocked: (needs: string) =>
          `Cannot start yet: needs ${needs} finished first`,
        unscheduled: "Not scheduled",
      },
      statusShort: {
        ok: "Ships",
        overflow: "Too late",
        overlap: "Overlap",
        blocked: "Blocked",
        unscheduled: "Left out",
      },
      barLabel: (title: string, from: number, to: number, status: string) =>
        `${title}, sprint ${from} to ${to}. ${status}`,
    },
    mission: {
      keyResults: "Pick key results",
      roadmap: "Ship something",
      conflicts: "No conflicts",
      rationale: "Explain the plan",
    },
    review: {
      title: "Review your plan",
      notes: "Your reasoning",
      keyResults: (count: number, total: number) =>
        `${count} of ${total} key results chosen`,
      shipping: (count: number) =>
        `${count} initiative${count === 1 ? "" : "s"} ship this quarter`,
      problems: (count: number) =>
        `${count} scheduled initiative${count === 1 ? " does" : "s do"} not ship as planned`,
      leftOut: (count: number) =>
        `${count} initiative${count === 1 ? " is" : "s are"} left out`,
      rationale: "Why this plan?",
      rationalePlaceholder:
        "Which initiatives move which key results, and what you chose not to do.",
      tradeoffs: "Message to the people whose work is not in the plan",
      tradeoffsPlaceholder:
        "What you would tell them: why not now, and what would change your mind.",
      coachNote:
        "Your coach reads these two answers. They do not change the score.",
    },
    submit: {
      button: "Submit plan",
      needsPlan:
        "Choose at least one key result and schedule one initiative to submit.",
      confirmTitle: "Submit this plan?",
      confirmBody:
        "Your key results and your roadmap will be scored against the best possible plan for this quarter.",
      confirm: "Submit",
      cancel: "Keep planning",
      submitting: "Scoring…",
      failed:
        "Your plan could not be scored. Check your connection and try again.",
    },
    results: {
      keyResults: "Key results",
      chosen: "You chose",
      quality: "Quality",
      ratings: ["Avoid", "Weak", "Strong"],
      yourRoadmap: "Your roadmap",
      bestRoadmap: "The best roadmap",
      value: (yours: number, best: number) =>
        `Your roadmap ships ${yours} points of value. The best one ships ${best}.`,
      initiatives: "Every initiative, explained",
      serves: "Moves",
      noObjective: "No objective",
      valueLabel: (value: number) => `Value ${value}`,
      inBest: (sprint: number) => `Best plan: starts in sprint ${sprint}`,
      notInBest: "Best plan: left out",
      principle: "Principle to remember",
    },
  },
  quick: {
    kinds: {
      pricing: "Pricing",
      go_to_market: "Go-to-market",
      incident: "Incident",
      build_buy: "Build vs. buy",
    },
    brief: {
      label: "The situation",
      exhibits: "Exhibits",
      source: (who: string) => `Source: ${who}`,
      exhibitNumber: (n: number) => `Exhibit ${n}`,
    },
    steps: {
      decision: (n: number, total: number) => `Decision ${n} of ${total}`,
      pickOne: "Choose one",
      pickMany: (count: number) => `Choose ${count}`,
      picked: (count: number, max: number) => `${count} of ${max} chosen`,
    },
    notes: {
      title: "In your own words",
      objective: "Write it up",
      reasoning: "Your reasoning",
      reasoningPlaceholder:
        "The numbers you used and what tipped each decision.",
      coachNote: "Your coach reads these. They do not change the score.",
    },
    submit: {
      button: "Submit answer",
      incomplete: (left: number) =>
        `${left} decision${left === 1 ? "" : "s"} still to make.`,
      confirmTitle: "Submit this answer?",
      confirmBody:
        "Your decisions will be scored, and you will see how every option rates with the numbers of this case.",
      confirm: "Submit",
      cancel: "Keep working",
      submitting: "Scoring…",
      failed:
        "Your answer could not be scored. Check your connection and try again.",
    },
    results: {
      ratings: ["Harmful", "Weak", "Defensible", "Best"],
      chosen: "You chose",
      ideal: "Model answer",
      principle: "Principle to remember",
      timed: (used: string, limit: number) =>
        `Timed: you used ${used} of ${limit}:00.`,
      untimed: "Played without the timer.",
    },
  },
  interview: {
    brief: {
      label: "The ask",
      goal: "Research goal",
      persona: "Who you are talking to",
      rules: (max: number) =>
        `You can ask ${max} questions. Ask them one at a time, as you would on a call.`,
    },
    mission: {
      questions: (min: number) => `Ask ${min} questions`,
      story: "Hear a real story",
      wrap: "Wrap up",
      findings: "Say what you learned",
    },
    chat: {
      title: "The interview",
      empty: (name: string) =>
        `${name} has joined the call and is waiting for your first question.`,
      you: "You",
      inputLabel: "Your question",
      placeholder: "Type a question and press Enter",
      send: "Ask",
      thinking: "is answering…",
      left: (count: number) =>
        `${count} question${count === 1 ? "" : "s"} left`,
      none: "No questions left. Wrap up the interview.",
      failed:
        "The question did not get through. Check your connection and ask again.",
      restart: "Start over",
      wrapUp: "Wrap up",
      back: "Back to the interview",
      minimum: (min: number) =>
        `Ask at least ${min} questions before you wrap up.`,
    },
    wrap: {
      title: "What did the interview show?",
      intro:
        "Tick only what the customer actually told you. A claim without evidence from this call counts against you.",
      summary: "Your summary for the team",
      summaryPlaceholder:
        "Three or four sentences: what you learned, in the customer's terms, and what the team should do next.",
      coachNote: "Your coach reads the summary. It does not change the score.",
    },
    submit: {
      button: "Submit interview",
      confirmTitle: "Submit this interview?",
      confirmBody:
        "Your questions and your findings will be scored. You will see how each question was read and what it uncovered.",
      confirm: "Submit",
      cancel: "Not yet",
      submitting: "Scoring…",
      failed:
        "Your interview could not be scored. Check your connection and try again.",
    },
    results: {
      transcript: "Your questions, one by one",
      tags: {
        open: "Open",
        closed: "Closed",
        smalltalk: "Small talk",
        leading: "Leading",
        hypothetical: "Hypothetical",
        pastBehavior: "About what happened",
        double: "Two questions in one",
      },
      depth: {
        greeting: "A greeting",
        off_topic: "Nothing to say on that",
        agree: "Polite agreement, no information",
        hypothetical: "A polite 'sure', no evidence",
        surface: "A short answer",
        open: "The general picture",
        deep: "The real story",
      } as Record<string, string>,
      uncovered: "Uncovered",
      findings: "What there was to learn",
      status: {
        found: "You uncovered it",
        missed: "You missed it",
        unsupported: "Not supported",
      },
      claimed: "You claimed it",
      tryAsking: "A question that reaches it",
      principle: "Principle to remember",
    },
  },
  auth: {
    signIn: "Sign in",
    attract: {
      eyebrow: "The PM practice arcade",
      tagline:
        "Plan sprints, chase metric drops, read experiments and write one-pagers. Every case scored by fixed rules, every answer explained.",
      kanbo: "Your sprint starts here. Ready?",
      pressStart: "Press start",
      worlds: "Worlds to clear",
      stats: (cases: number, worlds: number, skills: number) =>
        `${cases} cases · ${worlds} worlds · ${skills} skills`,
    },
    card: {
      eyebrow: "Insert coin",
      modes: "Account",
      signIn: "Sign in",
      signUp: "Create account",
      titleSignIn: "Welcome back, player",
      titleSignUp: "Start your run",
      subtitleSignIn: "Pick up your XP, stars and streak where you left them.",
      subtitleSignUp:
        "One account keeps your progress safe and on every device.",
      google: "Continue with Google",
      or: "or with your email",
      email: "Email",
      emailPlaceholder: "you@company.com",
      magicLink: "Send me a magic link",
      sending: "Sending…",
      noPassword: "No password to remember: we email you a one-time link.",
      guest: "Play as guest",
      guestHint: "Your progress is saved in this browser.",
      perksTitle: "With an account",
      perks: [
        "Your XP, stars, streak and badges on every device",
        "The progress already saved in this browser comes with you",
        "Your history and skill radar, safe if you clear the browser",
      ],
      invalidEmail: "That email does not look right. Check it and try again.",
      notConfigured:
        "Accounts open with the next update. Until then, everything you play is saved in this browser: carry on as a guest.",
      failed: "Something went wrong. Try again in a moment.",
      sent: (email: string) => `Check ${email}: your link is on its way.`,
    },
  },
  learn: {
    onboarding: {
      title: "How a case works",
      steps: [
        {
          title: "Read the brief",
          body: "A company, a problem and the data you would have on the job. Kanbo leaves a tip on every case.",
        },
        {
          title: "Make the calls",
          body: "Prioritise, investigate, decide or write, with the tools of the module. Take your time; drafts are saved as you go.",
        },
        {
          title: "See what was right",
          body: "Your score is computed by fixed rules, so it is the same every time. The results explain every choice and show the ideal answer.",
        },
      ],
    },
    lastTime: {
      title: (score: number) => `Last time you scored ${score}/100`,
      focus: "Focus on:",
      perfect: "You already aced this one. Try a harder case to keep learning.",
      attempts: (count: number) =>
        `${count} attempt${count === 1 ? "" : "s"} so far`,
    },
    nextSteps: {
      title: "What to do next",
      freshTitle: "Practise on a fresh case",
      freshBody:
        "Same kind of problem and level, new company and numbers. The best way to check you learned the lesson, not the answer.",
      freshCta: "New case",
      replayTitle: "Replay this case",
      replayBody:
        "Your weakest points from this attempt will be shown at the top of the case.",
      replayCta: "Replay",
      recommendTitle: "For your weakest skill",
      recommendCta: "Play",
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
    subtitle:
      "Every case of every world. Search, filter by level and pick up where your stars are missing.",
    filters: "Filter cases",
    search: "Search cases",
    searchPlaceholder: "Search by case, company or industry",
    module: "Worlds",
    allModules: "All worlds",
    industry: "Industry",
    allIndustries: "All industries",
    difficulty: "Level",
    allLevels: "All",
    status: "Status",
    allStatuses: "All",
    completed: "Played",
    notCompleted: "New",
    clear: "Clear filters",
    count: (shown: number, total: number) =>
      shown === total ? `${total} cases` : `${shown} of ${total} cases`,
    emptyTitle: "No case here",
    empty: "No case matches these filters. Loosen one, or clear them all.",
    worldSummary: (count: number, played: number) =>
      `${count} case${count === 1 ? "" : "s"} · ${played} played`,
    openWorld: "Open world",
    stats: {
      played: "Cases played",
      stars: "Stars",
      worlds: "Worlds explored",
    },
    suggestion: {
      label: "Kanbo suggests",
      first: "Not sure where to start? This one is a gentle first case.",
      weakest: (skill: string) =>
        `Your ${skill.toLowerCase()} could use some practice. Try this one.`,
      notPracticed: (skill: string) =>
        `You have not practised ${skill.toLowerCase()} yet. Try this one.`,
      play: "Play it",
      allDone:
        "You have played every case. Generate fresh ones from any world.",
    },
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
      "Your PM character sheet: an Elo-style rating per skill, built from your first attempt at each case.",
    loading: "Loading your skills…",
    stats: {
      overall: "Overall level",
      skills: "Skills trained",
      cases: "Cases counted",
    },
    kanbo: {
      label: "Kanbo's advice",
      first:
        "Every skill starts at the same level. Play a case and watch your sheet fill in. This one is a good start.",
      focus: (skill: string) =>
        `${skill} is where you can gain the most right now. Train it with this case.`,
      done: "You have played every case that trains your skills. Generate fresh ones from any world.",
    },
    sheetTitle: "Character sheet",
    radarTitle: "Skill radar",
    radarLabel: "Level per skill, from 0 to 100",
    radarEmpty: "Everyone starts at level 25. Your shape appears as you play.",
    level: "Level",
    levelShort: "LV",
    levelOf: (level: number) => `Level ${level} of 100`,
    rating: "Rating",
    delta: (change: number) => `${change > 0 ? "+" : ""}${change} last case`,
    attempts: (count: number) =>
      count === 0
        ? "Not practiced yet"
        : `${count} case${count === 1 ? "" : "s"}`,
    trainedBy: "Trained in",
    noModule: "No playable world trains this skill yet.",
    train: "Train",
    ranks: {
      rookie: "Rookie",
      rising: "Rising",
      strong: "Strong",
      expert: "Expert",
      master: "Master",
    },
    trendTitle: "Over time",
    trendLabel: "Rating per skill after each case",
    trendEmptyTitle: "No history yet",
    trendEmpty: "Your ratings over time appear after your first case.",
    caseNumber: (index: number) => (index === 0 ? "Start" : `Case ${index}`),
    nextTitle: "Practice next",
    nextIntro:
      "Unplayed cases for your weakest skills, at a difficulty that stretches you.",
    nextEmptyTitle: "Nothing left here",
    nextEmpty:
      "You have played every case that trains these skills. Generate fresh ones from any world.",
    reasons: {
      not_practiced: (skill: string) =>
        `You have not practiced ${skill.toLowerCase()} yet.`,
      weakest: (skill: string) => `${skill} is one of your weakest skills.`,
    },
    play: "Play it",
    howTitle: "How the rating works",
    how: [
      "Every skill starts at 1000, which is level 25.",
      "Cases are rated by level: APM 1000, PM 1200 and Senior 1400.",
      "Scoring above what your rating predicts raises it; scoring below lowers it.",
      "Only your first attempt at a case counts, because a replay knows the answer.",
      "A world counts fully for its first skill and half for the others.",
      "Levels go from 0 (rating 800) to 100 (rating 1600). Ranks:",
    ],
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
