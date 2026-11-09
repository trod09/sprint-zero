import type { Difficulty, ModuleStatus, Skill } from "@/core/case-engine";

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
