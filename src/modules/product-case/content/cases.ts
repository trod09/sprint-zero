/**
 * Hand-written Product Case specifications. Words live here; every number in
 * the research and the fact sheets is drawn from the seed by the generator.
 *
 * Severity, relief and fit are on a 0-3 scale; metric fit on 0-2. The
 * generator rejects a spec without a single best answer at each step.
 */
import type {
  EstimationSpec,
  ProductCaseSpec,
  StructuredSpec,
} from "../generator";

const harvestMealPlanning: StructuredSpec = {
  id: "product-case-harvest-meal-planning",
  seed: 52_101,
  difficulty: "apm",
  kind: "design",
  timeLimitMinutes: 30,
  company: {
    name: "Harvest",
    industry: "Grocery delivery",
    stage: "Series B, 400k monthly customers",
    description:
      "Harvest delivers groceries from local stores in under two hours in eight cities.",
  },
  title: "Design a feature that helps people cook at home",
  prompt:
    "Harvest wants more of its customers to cook at home during the week. Design a product or feature to make that happen.",
  brief:
    "The CEO saw that customers who cook from fresh ingredients order more often and stay longer, and asked your team to design something for them. You have the latest research below. Walk through it like an interview: who you build for, which problems matter, what you build first and how you will know it worked.",
  research: [
    {
      id: "revenue_mix",
      source: "analytics",
      text: "Households with children bring {share}% of revenue and order every {days} days on average.",
      numbers: {
        share: { min: 52, max: 61, step: 1 },
        days: { min: 5, max: 7, step: 1 },
      },
    },
    {
      id: "parent_interviews",
      source: "interviews",
      text: "{n} of {total} working parents we interviewed said deciding what to cook every evening is the most tiring part of the week; most then lose time turning the idea into a shopping list.",
      numbers: {
        n: { min: 9, max: 11, step: 1 },
        total: { min: 12, max: 12, step: 1 },
      },
    },
    {
      id: "student_survey",
      source: "survey",
      text: "Among students, {price}% name price as their first concern; only {plan}% say they plan meals ahead.",
      numbers: {
        price: { min: 68, max: 76, step: 1 },
        plan: { min: 9, max: 14, step: 1 },
      },
    },
    {
      id: "professional_interviews",
      source: "interviews",
      text: "Young professionals mostly buy ready meals and snacks. They cook about {times} times a week and complain mainly that weekend delivery slots run out.",
      numbers: { times: { min: 1, max: 2, step: 1 } },
    },
    {
      id: "substitutions",
      source: "support",
      text: "{tickets} support tickets last month were about substituted items, {recipe}% of them from customers who said it broke a recipe.",
      numbers: {
        tickets: { min: 380, max: 460, step: 10 },
        recipe: { min: 18, max: 26, step: 1 },
      },
    },
    {
      id: "recipe_baskets",
      source: "analytics",
      text: "Baskets that contain every ingredient of at least one recipe are reordered {lift}x more often within two weeks.",
      numbers: { lift: { min: 1.6, max: 2.1, step: 0.1 } },
    },
  ],
  segments: [
    {
      id: "busy_parents",
      name: "Working parents",
      description:
        "Families with children at home who do one big weekly order and cook most evenings.",
      fit: 3,
      why: "They bring most of the revenue, already cook most nights and say planning is their biggest pain. Helping them is helping the business.",
    },
    {
      id: "young_professionals",
      name: "Young professionals",
      description:
        "Singles and couples in their twenties who order often, mostly ready meals.",
      fit: 1,
      why: "They rarely cook, so a cooking feature asks them to change a habit they do not want to change. Their real pain is delivery slots.",
    },
    {
      id: "students",
      name: "Students",
      description:
        "Students sharing flats, small baskets, very price-sensitive.",
      fit: 1,
      why: "Price is their problem, not cooking. A feature for them would be a discount, and they bring little revenue.",
    },
    {
      id: "retirees",
      name: "Retirees",
      description:
        "Older customers who order for convenience and cook the same few meals.",
      fit: 0,
      why: "The research says nothing about their needs, so building for them would be a guess.",
    },
  ],
  problems: [
    {
      id: "deciding",
      statement: "Deciding what to cook every day takes mental energy.",
      severity: {
        busy_parents: 3,
        young_professionals: 1,
        students: 1,
        retirees: 1,
      },
      why: "Most interviewed parents named it first. It happens every day and blocks everything after it.",
    },
    {
      id: "shopping_list",
      statement: "Turning a meal plan into a shopping list takes too long.",
      severity: {
        busy_parents: 2,
        young_professionals: 1,
        students: 0,
        retirees: 0,
      },
      why: "The second step of the same job. Parents lose time on it every week, and Harvest is the natural place to fix it.",
    },
    {
      id: "picky_eaters",
      statement:
        "Meals have to suit everyone at the table, picky children included.",
      severity: {
        busy_parents: 1,
        young_professionals: 0,
        students: 0,
        retirees: 0,
      },
      why: "Real but not what parents raised first; a good planner can take it into account later.",
    },
    {
      id: "price",
      statement: "Groceries cost too much.",
      severity: {
        busy_parents: 1,
        young_professionals: 0,
        students: 3,
        retirees: 1,
      },
      why: "The students' first concern. For families it matters but does not stop them cooking.",
    },
    {
      id: "substitutions",
      statement: "Substituted items break the recipe the customer bought for.",
      severity: {
        busy_parents: 1,
        young_professionals: 1,
        students: 0,
        retirees: 1,
      },
      why: "A real annoyance in support tickets, but a minority of a few hundred tickets: worth fixing, not worth leading with.",
    },
    {
      id: "delivery_slots",
      statement: "Weekend delivery slots run out.",
      severity: {
        busy_parents: 1,
        young_professionals: 2,
        students: 0,
        retirees: 0,
      },
      why: "An operations problem that matters to young professionals; it does not make anyone cook more.",
    },
  ],
  solutions: [
    {
      id: "weekly_planner",
      name: "Weekly meal planner",
      description:
        "Suggests five dinners for the week from the family's past orders and tastes; one tap puts every ingredient in the basket.",
      effort: "M",
      relief: {
        deciding: 3,
        shopping_list: 3,
        picky_eaters: 1,
        price: 0,
        substitutions: 0,
        delivery_slots: 0,
      },
      why: "Solves both top problems in one flow: what to cook, then what to buy. Medium effort for the most relief.",
    },
    {
      id: "list_import",
      name: "Shopping list import",
      description: "Paste or photograph a list and Harvest fills the basket.",
      effort: "S",
      relief: {
        deciding: 0,
        shopping_list: 2,
        picky_eaters: 0,
        price: 0,
        substitutions: 0,
        delivery_slots: 0,
      },
      why: "Cheap and useful for the shopping list, but leaves the hardest part, deciding, untouched.",
    },
    {
      id: "ai_chef",
      name: "AI chef chat",
      description:
        "A chat assistant that answers cooking questions and suggests recipes.",
      effort: "L",
      relief: {
        deciding: 2,
        shopping_list: 1,
        picky_eaters: 1,
        price: 0,
        substitutions: 0,
        delivery_slots: 0,
      },
      why: "Helps with ideas, but a chat asks tired parents to do the work of asking. Large effort for less relief than a planner.",
    },
    {
      id: "recipe_library",
      name: "Recipe library",
      description:
        "Two thousand recipes with filters by time, diet and cuisine.",
      effort: "M",
      relief: {
        deciding: 1,
        shopping_list: 1,
        picky_eaters: 1,
        price: 0,
        substitutions: 0,
        delivery_slots: 0,
      },
      why: "More choice makes deciding harder, not easier. Every competitor has one.",
    },
    {
      id: "budget_mode",
      name: "Budget mode",
      description: "Swaps every item for the cheapest equivalent.",
      effort: "S",
      relief: {
        deciding: 0,
        shopping_list: 0,
        picky_eaters: 0,
        price: 3,
        substitutions: 0,
        delivery_slots: 0,
      },
      why: "Good for students, irrelevant to cooking more.",
    },
    {
      id: "recipe_safe_substitutions",
      name: "Recipe-safe substitutions",
      description:
        "Never substitutes an ingredient of a recipe without asking.",
      effort: "S",
      relief: {
        deciding: 0,
        shopping_list: 0,
        picky_eaters: 0,
        price: 0,
        substitutions: 3,
        delivery_slots: 0,
      },
      why: "A good follow-up once people plan recipes, not the first thing to build.",
    },
  ],
  metrics: [
    {
      id: "weekly_planners",
      name: "Weekly active planners",
      definition:
        "Households that put at least one planned meal in their basket each week.",
      success: 2,
      guardrail: 0,
      why: "Measures the new behavior directly and moves within weeks.",
    },
    {
      id: "recipe_views",
      name: "Recipe page views",
      definition: "Views of any recipe page.",
      success: 0,
      guardrail: 0,
      why: "A vanity metric: views go up with curiosity, not with cooking.",
    },
    {
      id: "basket_value",
      name: "Average basket value",
      definition: "Average value of a delivered order.",
      success: 1,
      guardrail: 1,
      why: "Likely to rise, but many things move it; it does not prove people cook more.",
    },
    {
      id: "retention",
      name: "8-week retention of families",
      definition:
        "Share of households with children still ordering eight weeks later.",
      success: 1,
      guardrail: 1,
      why: "The business outcome you hope for, but it takes two months to read and lags the feature.",
    },
    {
      id: "checkout_conversion",
      name: "Checkout conversion",
      definition: "Share of started baskets that become orders.",
      success: 0,
      guardrail: 2,
      why: "The right guardrail: a planner adds steps, and it must not make ordering harder.",
    },
    {
      id: "downloads",
      name: "App downloads",
      definition: "New installs of the Harvest app.",
      success: 0,
      guardrail: 0,
      why: "Has nothing to do with a feature for existing customers.",
    },
  ],
  ideal: {
    users:
      "Working parents: they bring more than half the revenue, already cook most evenings and told us planning is their biggest pain. Students and young professionals have real problems, but not cooking problems.",
    problems:
      "Deciding what to cook, then turning it into a shopping list. They are the two halves of the same weekly job, and most parents named them first.",
    solutions:
      "Build the weekly planner first: it relieves both problems in one flow for medium effort. The list import is a cheap second step, and the AI chef is a large bet that solves less.",
    metrics:
      "Success: weekly active planners, because it measures the new habit within weeks. Guardrail: checkout conversion, because the planner must not make ordering harder. Retention is the outcome to watch over the quarter.",
  },
  principle:
    "Pick the segment where the user's pain and the business's value overlap, then solve their most frequent problem end to end before adding anything else.",
};

const tuneboxPodcasts: StructuredSpec = {
  id: "product-case-tunebox-podcasts",
  seed: 52_202,
  difficulty: "pm",
  kind: "improvement",
  timeLimitMinutes: 25,
  company: {
    name: "Tunebox",
    industry: "Music streaming",
    stage: "Public, 30M monthly listeners",
    description:
      "Tunebox is a music streaming app that added podcasts two years ago.",
  },
  title: "Improve Tunebox for podcast listeners",
  prompt: "How would you improve Tunebox for podcast listeners?",
  brief:
    "Podcasts are a quarter of new Tunebox sign-ups, but podcast listeners churn faster than music listeners and many move to a dedicated podcast app. You lead the podcast team. Read the research and answer like an interview: who exactly you improve it for, what problem, what you ship first and how you measure it.",
  research: [
    {
      id: "listening_hours",
      source: "analytics",
      text: "Daily commuters are {users}% of podcast listeners but {hours}% of podcast listening hours. They follow {shows} shows on average.",
      numbers: {
        users: { min: 16, max: 21, step: 1 },
        hours: { min: 55, max: 64, step: 1 },
        shows: { min: 4, max: 6, step: 1 },
      },
    },
    {
      id: "churn",
      source: "analytics",
      text: "{churn}% of commuters who stopped listening on Tunebox kept listening to the same shows in another podcast app the next month.",
      numbers: { churn: { min: 38, max: 47, step: 1 } },
    },
    {
      id: "commuter_interviews",
      source: "interviews",
      text: "{n} of {total} commuters complained that an episode starts from the beginning when they move from phone to car. Several said new episodes of their shows are buried under music on Home.",
      numbers: {
        n: { min: 8, max: 10, step: 1 },
        total: { min: 11, max: 11, step: 1 },
      },
    },
    {
      id: "casual_survey",
      source: "survey",
      text: "Music-first listeners are the biggest group, but {not}% of them say they are not interested in podcasts.",
      numbers: { not: { min: 61, max: 70, step: 1 } },
    },
    {
      id: "learner_reviews",
      source: "support",
      text: "{reviews} app reviews this quarter asked for transcripts or finer speed control, mostly from people learning a language.",
      numbers: { reviews: { min: 140, max: 190, step: 10 } },
    },
    {
      id: "creator_requests",
      source: "support",
      text: "Podcast creators sent {requests} requests for audience analytics.",
      numbers: { requests: { min: 60, max: 90, step: 5 } },
    },
  ],
  segments: [
    {
      id: "commuters",
      name: "Daily commuters",
      description:
        "Listen to a few shows every day on the way to and from work, across phone and car.",
      fit: 3,
      why: "A minority of listeners but most of the listening hours, and the ones leaving for other apps. Keeping them is the podcast business.",
    },
    {
      id: "music_first",
      name: "Music-first listeners",
      description: "The largest group; tried a podcast once or twice.",
      fit: 1,
      why: "Biggest by headcount, which makes them tempting, but most say they do not want podcasts. Volume is not need.",
    },
    {
      id: "language_learners",
      name: "Language learners",
      description: "Use podcasts to study a language.",
      fit: 2,
      why: "A clear need and a loud voice in reviews, but a niche next to commuters.",
    },
    {
      id: "creators",
      name: "Podcast creators",
      description: "Publish their shows on Tunebox.",
      fit: 0,
      why: "The question is about listeners. Creators matter, but they are a different product.",
    },
  ],
  problems: [
    {
      id: "lost_position",
      statement:
        "Episodes lose their place when switching between phone and car.",
      severity: {
        commuters: 3,
        music_first: 1,
        language_learners: 2,
        creators: 0,
      },
      why: "Hits commuters every day at the exact moment they listen, and pushes them to apps that get it right.",
    },
    {
      id: "buried_episodes",
      statement:
        "New episodes of followed shows are buried under music on Home.",
      severity: {
        commuters: 2,
        music_first: 0,
        language_learners: 1,
        creators: 1,
      },
      why: "Makes the daily habit harder to keep; second in the interviews.",
    },
    {
      id: "discovery",
      statement: "It is hard to discover new shows worth trying.",
      severity: {
        commuters: 1,
        music_first: 2,
        language_learners: 1,
        creators: 3,
      },
      why: "Matters most to creators and music-first listeners. Commuters already know what they follow.",
    },
    {
      id: "downloads",
      statement: "Offline downloads fail or fill the phone.",
      severity: {
        commuters: 1,
        music_first: 0,
        language_learners: 1,
        creators: 0,
      },
      why: "A real annoyance in tunnels and on planes, but less frequent than the two above.",
    },
    {
      id: "playback_controls",
      statement: "No transcripts and only coarse speed control.",
      severity: {
        commuters: 1,
        music_first: 0,
        language_learners: 3,
        creators: 0,
      },
      why: "The learners' top need; nice to have for everyone else.",
    },
    {
      id: "creator_analytics",
      statement: "Creators cannot see who listens.",
      severity: {
        commuters: 0,
        music_first: 0,
        language_learners: 0,
        creators: 3,
      },
      why: "A creator problem, outside a listener question.",
    },
  ],
  solutions: [
    {
      id: "cross_device_resume",
      name: "Resume on any device",
      description:
        "Sync the playback position across phone, car and web in real time.",
      effort: "M",
      relief: {
        lost_position: 3,
        buried_episodes: 0,
        discovery: 0,
        downloads: 1,
        playback_controls: 0,
        creator_analytics: 0,
      },
      why: "Removes the commuters' biggest pain completely. The best value per unit of effort.",
    },
    {
      id: "new_episodes_shelf",
      name: "New episodes shelf",
      description:
        "A shelf at the top of Home with new episodes of followed shows.",
      effort: "S",
      relief: {
        lost_position: 0,
        buried_episodes: 2,
        discovery: 1,
        downloads: 0,
        playback_controls: 0,
        creator_analytics: 0,
      },
      why: "A cheap, good second step. It helps the habit but leaves the daily frustration in place.",
    },
    {
      id: "smart_downloads",
      name: "Smart downloads",
      description:
        "Download the next episode of followed shows on wifi and delete finished ones.",
      effort: "M",
      relief: {
        lost_position: 1,
        buried_episodes: 1,
        discovery: 0,
        downloads: 3,
        playback_controls: 0,
        creator_analytics: 0,
      },
      why: "Solves a smaller problem well. A sensible third item.",
    },
    {
      id: "ai_recommendations",
      name: "AI show recommendations",
      description: "Recommend new shows from each person's music taste.",
      effort: "L",
      relief: {
        lost_position: 0,
        buried_episodes: 1,
        discovery: 3,
        downloads: 0,
        playback_controls: 0,
        creator_analytics: 0,
      },
      why: "The tempting answer, aimed at music-first listeners who said they do not want podcasts. Large effort for the wrong problem.",
    },
    {
      id: "transcripts",
      name: "Transcripts and speed",
      description: "Synced transcripts and speed from 0.5x to 3x.",
      effort: "M",
      relief: {
        lost_position: 0,
        buried_episodes: 0,
        discovery: 0,
        downloads: 0,
        playback_controls: 3,
        creator_analytics: 0,
      },
      why: "Exactly right for language learners; little for commuters.",
    },
    {
      id: "creator_dashboard",
      name: "Creator dashboard",
      description: "Audience analytics for podcast creators.",
      effort: "L",
      relief: {
        lost_position: 0,
        buried_episodes: 0,
        discovery: 0,
        downloads: 0,
        playback_controls: 0,
        creator_analytics: 3,
      },
      why: "Serves creators, not listeners.",
    },
  ],
  metrics: [
    {
      id: "commuter_retention",
      name: "Weekly podcast retention of commuters",
      definition:
        "Share of commuters who listen to a podcast on Tunebox in two consecutive weeks.",
      success: 2,
      guardrail: 0,
      why: "Measures the exact behavior you want to keep, for the segment you chose, and reads within weeks.",
    },
    {
      id: "shows_followed",
      name: "Shows followed per user",
      definition: "Average number of shows a podcast listener follows.",
      success: 1,
      guardrail: 0,
      why: "Related, but following is cheap; it does not show people stay.",
    },
    {
      id: "music_hours",
      name: "Music listening hours",
      definition: "Weekly music hours per listener.",
      success: 0,
      guardrail: 2,
      why: "The right guardrail: podcast changes on Home must not eat into music, which pays the bills.",
    },
    {
      id: "premium_churn",
      name: "Premium churn",
      definition: "Monthly cancellations of paid plans.",
      success: 1,
      guardrail: 1,
      why: "Moves for many reasons and slowly; a business outcome, not a feature metric.",
    },
    {
      id: "podcast_dau",
      name: "Podcast DAU",
      definition: "Daily users who play any podcast.",
      success: 1,
      guardrail: 0,
      why: "Mixes every segment; a shelf could lift it while commuters still leave.",
    },
    {
      id: "app_rating",
      name: "App store rating",
      definition: "Average rating in the app stores.",
      success: 0,
      guardrail: 0,
      why: "Too slow and too noisy to judge one feature.",
    },
  ],
  ideal: {
    users:
      "Daily commuters: about a fifth of podcast listeners but most of the hours, and the ones moving to other apps. Music-first listeners are the biggest group, but most of them told us they do not want podcasts.",
    problems:
      "Losing their place between phone and car, then new episodes buried under music. Both break the daily habit that keeps commuters on Tunebox.",
    solutions:
      "Ship resume on any device first: it removes the biggest pain for medium effort. Then the new episodes shelf, which is cheap, then smart downloads. AI recommendations are the tempting answer for the wrong segment.",
    metrics:
      "Success: weekly podcast retention of commuters. Guardrail: music listening hours, so podcast work on Home does not hurt the core business.",
  },
  principle:
    "In an improvement question, find the users who get the most value today and are at risk of leaving; fix what makes them leave before chasing new users.",
};

const ledgerlineInvoicing: StructuredSpec = {
  id: "product-case-ledgerline-free-invoicing",
  seed: 52_303,
  difficulty: "senior",
  kind: "strategy",
  timeLimitMinutes: 30,
  company: {
    name: "Ledgerline",
    industry: "Accounting software for small businesses",
    stage: "Series C, 90k paying businesses",
    description:
      "Ledgerline sells bookkeeping, invoicing and payroll to small businesses, on a $12 Starter plan and a $79 Growth plan.",
  },
  title: "Respond to a competitor's free invoicing",
  prompt:
    "A well-funded competitor just made invoicing free for small businesses. What should Ledgerline do?",
  brief:
    "The board wants a response this quarter, and the sales team is pushing to make invoicing free too. You are the senior PM for the core product. Decide which customers to defend, which needs to win on, which move to make first and how you will know it is working.",
  research: [
    {
      id: "plan_mix",
      source: "analytics",
      text: "Starter is {starterCustomers}% of customers and {starterRevenue}% of revenue. Growth is {growthCustomers}% of customers and {growthRevenue}% of revenue.",
      numbers: {
        starterCustomers: { min: 54, max: 58, step: 1 },
        starterRevenue: { min: 17, max: 21, step: 1 },
        growthCustomers: { min: 28, max: 31, step: 1 },
        growthRevenue: { min: 58, max: 63, step: 1 },
      },
    },
    {
      id: "churn_reasons",
      source: "survey",
      text: "Since the launch, Starter churn rose by {starterRise} points; Growth churn did not move. Leaving Starter customers name price first.",
      numbers: { starterRise: { min: 1.2, max: 1.8, step: 0.1 } },
    },
    {
      id: "growth_interviews",
      source: "interviews",
      text: "{n} of {total} Growth customers said bank reconciliation takes them a day or more each month; many also want to see cash for the coming weeks.",
      numbers: {
        n: { min: 10, max: 12, step: 1 },
        total: { min: 14, max: 14, step: 1 },
      },
    },
    {
      id: "accountant_channel",
      source: "analytics",
      text: "Accounting firms are {firms}% of accounts but bring {referrals}% of new Growth customers.",
      numbers: {
        firms: { min: 12, max: 16, step: 1 },
        referrals: { min: 36, max: 44, step: 1 },
      },
    },
    {
      id: "competitor",
      source: "market",
      text: "The competitor offers invoicing only. It has no payroll, no bank reconciliation and no multi-user access.",
    },
    {
      id: "midmarket",
      source: "support",
      text: "{deals} mid-market prospects asked for multi-entity consolidation last quarter; none of them closed.",
      numbers: { deals: { min: 20, max: 30, step: 1 } },
    },
  ],
  segments: [
    {
      id: "growth_smbs",
      name: "Growth businesses",
      description:
        "Companies with 5 to 50 employees on the $79 plan, using payroll and several users.",
      fit: 3,
      why: "Most of the revenue, untouched by a competitor that only does invoicing, and asking for things only Ledgerline can build. Defend and deepen the moat here.",
    },
    {
      id: "sole_traders",
      name: "Sole traders",
      description:
        "Freelancers and one-person businesses on the $12 Starter plan.",
      fit: 1,
      why: "The segment under attack and the loudest in churn data, but a small share of revenue. Chasing them on price is the competitor's game.",
    },
    {
      id: "accounting_firms",
      name: "Accounting firms",
      description: "Firms that keep the books of many small clients.",
      fit: 2,
      why: "A strong channel into Growth customers. A good second front, not the first.",
    },
    {
      id: "mid_market",
      name: "Mid-market companies",
      description:
        "Businesses with 200+ employees that need ERP-like features.",
      fit: 0,
      why: "A different product and none of the open deals closed. Not a response to this threat.",
    },
  ],
  problems: [
    {
      id: "reconciliation",
      statement: "Bank reconciliation takes hours every month.",
      severity: {
        growth_smbs: 3,
        sole_traders: 1,
        accounting_firms: 2,
        mid_market: 1,
      },
      why: "The Growth customers' biggest pain, and something an invoicing-only competitor cannot offer.",
    },
    {
      id: "cash_visibility",
      statement: "No view of cash for the coming weeks.",
      severity: {
        growth_smbs: 2,
        sole_traders: 1,
        accounting_firms: 1,
        mid_market: 1,
      },
      why: "Second in the interviews; builds on data only Ledgerline has (invoices, bills and payroll).",
    },
    {
      id: "invoicing_price",
      statement: "Paying for invoicing that others now give away.",
      severity: {
        growth_smbs: 1,
        sole_traders: 3,
        accounting_firms: 0,
        mid_market: 0,
      },
      why: "Real for sole traders; Growth customers pay for much more than invoicing.",
    },
    {
      id: "many_clients",
      statement: "Accountants juggle many client books with separate logins.",
      severity: {
        growth_smbs: 0,
        sole_traders: 0,
        accounting_firms: 3,
        mid_market: 0,
      },
      why: "The accounting firms' main pain.",
    },
    {
      id: "late_payments",
      statement: "Customers pay invoices late.",
      severity: {
        growth_smbs: 1,
        sole_traders: 2,
        accounting_firms: 0,
        mid_market: 0,
      },
      why: "Matters more to the smallest businesses.",
    },
    {
      id: "consolidation",
      statement: "Several companies cannot be consolidated.",
      severity: {
        growth_smbs: 0,
        sole_traders: 0,
        accounting_firms: 1,
        mid_market: 3,
      },
      why: "A mid-market need.",
    },
  ],
  solutions: [
    {
      id: "auto_reconciliation",
      name: "Automatic reconciliation",
      description:
        "Match bank transactions to invoices and bills automatically, with rules for the rest.",
      effort: "L",
      relief: {
        reconciliation: 3,
        cash_visibility: 1,
        invoicing_price: 0,
        many_clients: 1,
        late_payments: 0,
        consolidation: 0,
      },
      why: "Large, but it removes the Growth customers' biggest pain and widens the gap with an invoicing-only rival. Best value per unit of effort here.",
    },
    {
      id: "cash_forecast",
      name: "Cash forecast",
      description: "A 13-week cash forecast from invoices, bills and payroll.",
      effort: "M",
      relief: {
        reconciliation: 0,
        cash_visibility: 3,
        invoicing_price: 0,
        many_clients: 0,
        late_payments: 1,
        consolidation: 0,
      },
      why: "A strong second move on data the competitor does not have.",
    },
    {
      id: "free_invoicing",
      name: "Make invoicing free",
      description: "Match the competitor: free invoicing on every plan.",
      effort: "S",
      relief: {
        reconciliation: 0,
        cash_visibility: 0,
        invoicing_price: 3,
        many_clients: 0,
        late_payments: 0,
        consolidation: 0,
      },
      why: "Cheap to ship and loved by sales, but it gives away revenue to defend the smallest customers and fights on the competitor's terms.",
    },
    {
      id: "partner_hub",
      name: "Partner hub",
      description: "One login for accountants to manage every client's books.",
      effort: "M",
      relief: {
        reconciliation: 1,
        cash_visibility: 0,
        invoicing_price: 0,
        many_clients: 3,
        late_payments: 0,
        consolidation: 1,
      },
      why: "Right for the accounting channel; a good third move.",
    },
    {
      id: "invoice_payments",
      name: "Card payments on invoices",
      description: "Let customers pay invoices by card with next-day payouts.",
      effort: "M",
      relief: {
        reconciliation: 0,
        cash_visibility: 1,
        invoicing_price: 1,
        many_clients: 0,
        late_payments: 3,
        consolidation: 0,
      },
      why: "Helps small businesses get paid, mostly sole traders.",
    },
    {
      id: "acquire_startup",
      name: "Acquire an invoicing startup",
      description: "Buy a small invoicing company to bundle its product.",
      effort: "L",
      relief: {
        reconciliation: 0,
        cash_visibility: 0,
        invoicing_price: 2,
        many_clients: 0,
        late_payments: 1,
        consolidation: 0,
      },
      why: "Expensive and slow, and it buys more of what is being commoditized.",
    },
  ],
  metrics: [
    {
      id: "growth_nrr",
      name: "Net revenue retention of Growth",
      definition:
        "Revenue from Growth customers this year over the same customers last year, upgrades included.",
      success: 2,
      guardrail: 0,
      why: "Measures whether the segment that pays the bills stays and grows.",
    },
    {
      id: "signups",
      name: "New sign-ups",
      definition: "New accounts on any plan, free included.",
      success: 0,
      guardrail: 0,
      why: "Free invoicing would lift it while revenue falls; the wrong signal.",
    },
    {
      id: "starter_churn",
      name: "Starter churn",
      definition: "Monthly cancellations of the Starter plan.",
      success: 1,
      guardrail: 1,
      why: "Worth watching, but it measures the segment you chose not to defend first.",
    },
    {
      id: "gross_margin",
      name: "Gross margin",
      definition: "Revenue minus the cost to serve it, as a share of revenue.",
      success: 0,
      guardrail: 2,
      why: "The right guardrail: a strategic response must not buy retention with price cuts or costly bets.",
    },
    {
      id: "invoices_sent",
      name: "Invoices sent",
      definition: "Invoices sent through Ledgerline per month.",
      success: 0,
      guardrail: 0,
      why: "Measures the commodity you decided not to compete on.",
    },
    {
      id: "accountant_referrals",
      name: "Accountant referrals",
      definition: "New Growth customers referred by accounting firms.",
      success: 1,
      guardrail: 1,
      why: "Good for the channel, but only part of the picture.",
    },
  ],
  ideal: {
    users:
      "Defend Growth businesses. They bring about 60% of revenue, their churn did not move and they rely on things the competitor does not have. Sole traders are the ones churning, but chasing them means competing on price for a fifth of revenue.",
    problems:
      "Bank reconciliation, then cash visibility. Both are deep accounting problems that an invoicing-only rival cannot solve.",
    solutions:
      "Build automatic reconciliation first, then the cash forecast, then the partner hub for the accountant channel. Making invoicing free is cheap to ship but gives revenue away to fight on the competitor's terms.",
    metrics:
      "Success: net revenue retention of Growth customers. Guardrail: gross margin, so the response does not buy retention with price cuts. Keep an eye on Starter churn without letting it drive the plan.",
  },
  principle:
    "When a competitor commoditizes one feature, do not race them to zero: defend the customers who pay for the whole product and deepen what the competitor cannot copy.",
};

const pawpalMarket: EstimationSpec = {
  id: "product-case-pawpal-dog-walking",
  seed: 52_404,
  difficulty: "pm",
  kind: "estimation",
  timeLimitMinutes: 15,
  answerUnit: "US dollars per year",
  company: {
    name: "Pawpal",
    industry: "Pet services marketplace",
    stage: "Seed, live in two cities",
    description:
      "Pawpal connects dog owners with vetted local dog walkers and takes a commission on every walk.",
  },
  title: "Estimate Pawpal's revenue in a new city",
  prompt:
    "Pawpal is thinking about launching in Marlow Bay. If it won the whole paid dog-walking market there, how much revenue would Pawpal make in a year?",
  brief:
    "The founders want a quick estimate before they spend on a launch. Analysts left you a fact sheet with more facts than you need, and some of them would lead you astray. Choose the facts the estimate needs, add any constant factors, and give your number. Pawpal's revenue is its commission, not what owners pay walkers.",
  facts: [
    {
      id: "households",
      label: "Households in Marlow Bay",
      unit: "households",
      source: "City census",
      range: { min: 480_000, max: 540_000, step: 10_000 },
      note: "The right base: dogs, and decisions to pay a walker, belong to households.",
    },
    {
      id: "population",
      label: "People living in Marlow Bay",
      unit: "people",
      source: "City census",
      range: { min: 1_150_000, max: 1_300_000, step: 50_000 },
      note: "The trap: starting from people counts every member of a dog-owning household as a separate customer.",
    },
    {
      id: "dog_share",
      label: "Households with at least one dog",
      unit: "%",
      source: "Pet owners' survey",
      range: { min: 18, max: 24, step: 1 },
      note: "Needed: only households with a dog can buy walks.",
    },
    {
      id: "likes_dogs",
      label: "Adults who say they like dogs",
      unit: "%",
      source: "Opinion poll",
      range: { min: 55, max: 65, step: 1 },
      note: "Irrelevant: liking dogs does not mean owning one or paying for walks.",
    },
    {
      id: "paid_walk_share",
      label: "Dog-owning households that pay for walks every week",
      unit: "%",
      source: "Pet owners' survey",
      range: { min: 8, max: 12, step: 1 },
      note: "Needed: most owners walk their own dog.",
    },
    {
      id: "walks_per_week",
      label: "Paid walks per week, in households that pay for walks",
      unit: "walks",
      source: "Walker interviews",
      range: { min: 2.5, max: 3.5, step: 0.5 },
      note: "Needed: frequency of the paid service.",
    },
    {
      id: "price",
      label: "Average price of a walk, all dogs of the household included",
      unit: "USD",
      source: "Walker interviews",
      range: { min: 18, max: 22, step: 1 },
      note: "Needed: the price is per visit, so the number of dogs does not multiply it.",
    },
    {
      id: "dogs_per_household",
      label: "Dogs per dog-owning household",
      unit: "dogs",
      source: "Pet owners' survey",
      range: { min: 1.2, max: 1.4, step: 0.1 },
      note: "Double counting: the walk price already covers every dog of the household.",
    },
    {
      id: "take_rate",
      label: "Pawpal's commission on each walk",
      unit: "%",
      source: "Pawpal",
      range: { min: 20, max: 20, step: 1 },
      note: "Needed: Pawpal earns its commission, not the price of the walk.",
    },
    {
      id: "vet_spend",
      label: "Yearly vet spend per dog",
      unit: "USD",
      source: "Pet owners' survey",
      range: { min: 400, max: 600, step: 50 },
      note: "Irrelevant: a different market.",
    },
  ],
  requiredFactIds: [
    "households",
    "dog_share",
    "paid_walk_share",
    "walks_per_week",
    "price",
    "take_rate",
  ],
  constants: [{ value: 52, label: "weeks in a year" }],
  compute: (v) =>
    v.households *
    (v.dog_share / 100) *
    (v.paid_walk_share / 100) *
    v.walks_per_week *
    52 *
    v.price *
    (v.take_rate / 100),
  trap: (v) =>
    v.population *
    (v.dog_share / 100) *
    (v.paid_walk_share / 100) *
    v.walks_per_week *
    52 *
    v.price *
    (v.take_rate / 100),
  formula: (v) =>
    `${v.households.toLocaleString("en-US")} households x ${v.dog_share}% with a dog x ${v.paid_walk_share}% paying for walks x ${v.walks_per_week} walks a week x 52 weeks x $${v.price} a walk x ${v.take_rate}% commission`,
  ideal: (v) =>
    `Start from households, not people: a dog and the decision to hire a walker belong to a household. Narrow to the ${v.dog_share}% with a dog and the ${v.paid_walk_share}% of those who pay for walks every week. Multiply by ${v.walks_per_week} walks a week and 52 weeks to get walks a year, then by the $${v.price} price and Pawpal's ${v.take_rate}% commission. Leave out dogs per household (the price already covers every dog), people who like dogs and vet spend. A quick sanity check: about ${Math.round(v.households * (v.dog_share / 100) * (v.paid_walk_share / 100)).toLocaleString("en-US")} paying households, each worth roughly $${Math.round(v.walks_per_week * 52 * v.price * (v.take_rate / 100)).toLocaleString("en-US")} a year to Pawpal.`,
  principle:
    "Pick the unit that buys (a household, a business, a trip) before you multiply, and check each factor is not already counted in another.",
};

export const productCaseSpecs: readonly ProductCaseSpec[] = [
  harvestMealPlanning,
  tuneboxPodcasts,
  ledgerlineInvoicing,
  pawpalMarket,
];
