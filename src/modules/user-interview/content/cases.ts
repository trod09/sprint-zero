/**
 * Hand-written interviews. Each persona has topics with three replies
 * (closed question, open question, question about what really happened) and
 * a list of findings: some the interview can show, some that only sound
 * plausible.
 *
 * Keywords are word stems: "swap" also matches "swapping" and "swaps". A
 * trailing "$" asks for the whole word: "app$" does not match "approve".
 */
import type { InterviewCase } from "../schema";

const LEADING_REPLIES = [
  "Yeah, I suppose so.",
  "Sure, if you put it that way.",
  "Mm, probably, yes.",
];

const maya: InterviewCase = {
  id: "user-interview-maya-shift-swaps",
  moduleId: "user-interview",
  seed: 91_101,
  difficulty: "apm",
  company: {
    name: "Rosterly",
    industry: "SaaS B2B",
    stage: "Series A, 6,000 paying locations",
    description:
      "Shift scheduling for restaurants and shops. Managers build the weekly schedule; staff see their shifts in the app.",
  },
  title: "Why do shift swaps happen outside the app?",
  brief:
    "Rosterly's data shows managers build schedules in the app every week, but almost no shift swaps go through it. The team is about to design a new swap feature and asked you to talk to a customer first. You have one short call.",
  persona: {
    name: "Maya Okafor",
    role: "Shift manager, three bakeries, about 40 staff",
    context:
      "Has used Rosterly for eight months. Agreed to a 20-minute call between the morning and afternoon rush.",
  },
  researchGoal:
    "Find out how shift swaps really happen in her bakeries, and what that costs her.",
  findings: [
    {
      id: "group_chat",
      text: "Staff arrange swaps in a group chat because the app does not show who is free to cover",
    },
    {
      id: "approval_laptop",
      text: "Approving a swap only works on a laptop, and she is on the shop floor with her phone all day",
    },
    {
      id: "payroll_errors",
      text: "The schedule that goes to payroll is wrong after swaps, and she fixes it by hand for hours every week",
    },
    {
      id: "new_hires",
      text: "New hires join the group chat on day one but wait weeks for an app login",
    },
    {
      id: "would_use_matching",
      text: "She would use a feature that matches swaps automatically",
    },
    {
      id: "slow_scheduling",
      text: "Building the weekly schedule takes her too long",
    },
    {
      id: "staff_dislike_app",
      text: "Her staff dislike how the app looks and feels",
    },
  ],
  hidden: {
    guarded: false,
    topics: [
      {
        id: "week",
        label: "Her week",
        keywords: [
          "day",
          "week",
          "role",
          "job",
          "typical",
          "yourself",
          "responsib",
          "manage",
          "work",
        ],
        surface: "Yes, I run the schedule for all three shops.",
        open: "I manage about forty people across three bakeries. Sunday night I build next week's schedule, and that part is fine. It's everything that changes afterwards that eats my week.",
        deep: "Last week I built the schedule on Sunday, and by Wednesday eleven shifts had changed hands. I only knew about four of them. The rest I found out when someone else turned up.",
        exampleQuestion:
          "Walk me through a typical week in your job, starting with last Sunday.",
      },
      {
        id: "swaps",
        label: "How swaps happen",
        keywords: [
          "swap",
          "switch",
          "trade",
          "cover",
          "sick",
          "replace",
          "whatsapp",
          "chat",
          "group",
        ],
        surface: "Yes, people swap all the time.",
        open: "Swaps happen in our WhatsApp group. Somebody writes 'can anyone take my Saturday', someone answers, done. I usually find out later.",
        deep: "Last Thursday Dani posted at eleven at night that she couldn't open on Friday. Two people replied, each thought the other had it, and nobody came at five. I opened the shop myself. They use the chat because in the app nobody can see who is free that day, so there's no one to ask.",
        exampleQuestion:
          "Tell me about the last time someone needed their shift covered. What happened?",
      },
      {
        id: "approval",
        label: "Approving changes",
        keywords: [
          "approv",
          "permission",
          "laptop",
          "phone",
          "mobile",
          "notif",
          "confirm",
          "accept",
        ],
        surface: "I'm supposed to approve them, yes.",
        open: "Officially I approve every change. In practice I approve whatever has already happened.",
        deep: "Approving only works on the website, and I'm on the shop floor with my phone from six until three. So approvals pile up until the evening. Last month I approved a swap two days after the shift had been worked.",
        exampleQuestion: "Walk me through the last swap you approved.",
      },
      {
        id: "payroll",
        label: "Payroll",
        keywords: [
          "pay",
          "payroll",
          "hour",
          "wage",
          "overtime",
          "timesheet",
          "salary",
          "money",
          "friday",
        ],
        surface: "Payroll runs from the schedule, yes.",
        open: "Payroll is the part that worries me. Whatever is in the app on Friday is what people get paid for.",
        deep: "Because swaps happen in the chat, the app is wrong by the end of the week. In March two people were paid for shifts they didn't work and one wasn't paid for one she did. Now every Friday I spend about two hours going through the chat and correcting the schedule before it goes to payroll.",
        exampleQuestion: "What happened the last time payroll went out?",
      },
      {
        id: "new_staff",
        label: "New staff",
        keywords: [
          "new",
          "hire",
          "onboard",
          "train",
          "turnover",
          "quit",
          "leave",
          "student",
          "summer",
          "login",
          "account",
        ],
        surface: "We hire quite a lot, especially in summer.",
        open: "Summer is mostly students, so there are always new faces. Getting them set up takes a while.",
        deep: "Head office creates the app logins and it takes a week or two. So on day one I add new people to the WhatsApp group instead, and that's where they learn how everything works here. By the time the login arrives they don't need it.",
        exampleQuestion:
          "Tell me how your most recent hire got through their first days.",
      },
      {
        id: "app",
        label: "The app itself",
        keywords: [
          "app$",
          "rosterly",
          "feature",
          "tool",
          "software",
          "product",
          "schedule",
          "build",
          "design",
          "like",
        ],
        surface: "It's fine. It does the job.",
        open: "Building the schedule is quick, I'll give it that. I copy last week and adjust.",
        deep: "Last Sunday the schedule took me twenty minutes. I copied the week before and moved three people. No complaints there, and the staff have never said anything about the app either way.",
        exampleQuestion: "How did building last week's schedule go?",
      },
    ],
    findings: [
      {
        id: "group_chat",
        supported: true,
        topicId: "swaps",
        why: "She told the story of a missed opening shift and said staff use the chat because the app cannot show who is free.",
      },
      {
        id: "approval_laptop",
        supported: true,
        topicId: "approval",
        why: "Approval is web-only and she works on her feet with a phone, so approvals come after the fact.",
      },
      {
        id: "payroll_errors",
        supported: true,
        topicId: "payroll",
        why: "The costliest problem: people paid wrongly in March, and two hours every Friday rebuilding the schedule from the chat.",
      },
      {
        id: "new_hires",
        supported: true,
        topicId: "new_staff",
        why: "Logins take one to two weeks, so the group chat becomes the tool new staff learn first.",
      },
      {
        id: "would_use_matching",
        supported: false,
        topicId: null,
        why: "At most she said 'sure' to a hypothetical. What people say they would use predicts little, and she never described needing it.",
      },
      {
        id: "slow_scheduling",
        supported: false,
        topicId: null,
        why: "The opposite: she says building the schedule is quick and takes about twenty minutes.",
      },
      {
        id: "staff_dislike_app",
        supported: false,
        topicId: null,
        why: "Nothing in the interview says so. Staff avoid the app for swaps because it cannot do what the chat does.",
      },
    ],
    replies: {
      greeting:
        "Hi! Happy to help. I've got about twenty minutes before the afternoon rush.",
      leading: LEADING_REPLIES,
      hypothetical: [
        "Sure, I'd probably use that.",
        "Sounds good, yeah. Why not.",
        "I guess so. Hard to say until I see it.",
      ],
      offTopic: [
        "Hm, I'm not sure what to tell you there. Ask me about how the week actually goes.",
        "I don't have much to say about that, sorry.",
      ],
    },
    principle:
      "Ask about the last time it happened, not about what people would do. Stories about real events show the workaround, what it costs and why the product is not part of it.",
  },
};

const tomas: InterviewCase = {
  id: "user-interview-tomas-reminders",
  moduleId: "user-interview",
  seed: 91_202,
  difficulty: "pm",
  company: {
    name: "Ledgerline",
    industry: "Fintech",
    stage: "Series B",
    description:
      "Invoicing and payments for freelancers. Invoices can send automatic reminders when a client pays late.",
  },
  title: "Why does nobody turn on payment reminders?",
  brief:
    "Late payment is the top complaint of Ledgerline's freelancers, yet only 9% of them switch on automatic reminders. The team assumes people have not found the setting and plans to make it more visible. Talk to a customer before that ships.",
  persona: {
    name: "Tomás Rivera",
    role: "Freelance illustrator, six years on his own",
    context:
      "Sends eight to ten invoices a month with Ledgerline. Has never turned on reminders. Friendly, but busy with a deadline.",
  },
  researchGoal:
    "Find out what he does when a client pays late, and why reminders stay off.",
  findings: [
    {
      id: "few_clients",
      text: "Three clients are most of his income, so he will not risk sounding pushy with an automatic message",
    },
    {
      id: "chases_by_hand",
      text: "He does chase late payments, by hand, with a personal message he softens with an excuse",
    },
    {
      id: "cash_flow",
      text: "A late payment recently forced him to borrow to pay rent: the pain is cash flow, not the time spent chasing",
    },
    {
      id: "cannot_edit",
      text: "He looked at reminders and left them off because he cannot change the wording or timing per client",
    },
    {
      id: "bank_checking",
      text: "He finds out an invoice was paid by checking his bank, and has no idea whether a client has even opened it",
    },
    {
      id: "not_found",
      text: "He has not found the reminders setting",
    },
    {
      id: "would_pay_fees",
      text: "He would pay for a plan that charges clients late fees automatically",
    },
    {
      id: "forgets_invoices",
      text: "He forgets to send invoices on time",
    },
    {
      id: "too_expensive",
      text: "He finds Ledgerline too expensive",
    },
  ],
  hidden: {
    guarded: false,
    topics: [
      {
        id: "work",
        label: "His work",
        keywords: [
          "work",
          "day",
          "job",
          "typical",
          "yourself",
          "freelanc",
          "illustrat",
          "deliver",
          "month",
          "business",
          "project",
        ],
        surface: "Yes, full-time freelance for six years now.",
        open: "I do editorial illustration, mostly for magazines and a couple of agencies. I send the invoice the day I deliver, always. Getting paid is another story.",
        deep: "Last month I delivered four jobs and invoiced each one the same afternoon. Two were paid on time. The other two I was still waiting for three weeks later.",
        exampleQuestion:
          "Walk me through last month: what did you deliver, and what happened with the invoices?",
      },
      {
        id: "clients",
        label: "His clients",
        keywords: [
          "client",
          "customer",
          "relationship",
          "agenc",
          "magazine",
          "art director",
          "trust",
          "pushy",
          "annoy",
        ],
        surface: "I have a handful of regular clients, yes.",
        open: "Most of my work comes from a few people I've known for years. You don't want to be the freelancer who is difficult about money.",
        deep: "Three clients were about eighty percent of my income last year. One art director moved to another magazine and took me with her. If she gets a cold robot email saying 'your invoice is overdue', that's the relationship I live on. I'm not risking it for one late payment.",
        exampleQuestion:
          "Tell me about the clients you invoiced recently and how each relationship started.",
      },
      {
        id: "late",
        label: "Late payments",
        keywords: [
          "late",
          "overdue",
          "delay",
          "wait",
          "cash",
          "rent",
          "money",
          "paid",
          "pay",
          "owe",
          "unpaid",
        ],
        surface: "Yes, late payments happen a lot.",
        open: "About a third of my invoices are paid late. Thirty days becomes forty-five, sixty. You learn to live with it, more or less.",
        deep: "In October an agency paid me forty-seven days late, and it was my biggest invoice of the quarter. I put the rent on my credit card that month. The chasing itself takes ten minutes. It's the not knowing when the money comes that keeps me up.",
        exampleQuestion:
          "Tell me about the last invoice that was paid late. What happened?",
      },
      {
        id: "chasing",
        label: "How he chases",
        keywords: [
          "chase",
          "follow",
          "remind",
          "nudge",
          "message",
          "email",
          "ask",
          "accountant",
          "excuse",
          "collect",
        ],
        surface: "I follow up sometimes, yes.",
        open: "I keep a note on my phone of who owes me what. On Fridays I look at it and decide who gets a nudge.",
        deep: "Last Friday I wrote to an agency: 'Hi Clara, my accountant is closing the quarter and asked me about invoice 114, any news?' There is no accountant. It gives me a reason to ask that isn't 'pay me'. I write each one myself, in my own voice, depending on who it is.",
        exampleQuestion:
          "What did you do the last time you followed up on an unpaid invoice?",
      },
      {
        id: "reminders",
        label: "The reminders feature",
        keywords: [
          "automatic",
          "reminders",
          "feature",
          "setting",
          "turn on",
          "switch",
          "wording",
          "template",
          "custom",
          "edit",
          "tone",
          "option",
        ],
        surface: "I know it's there. I don't use it.",
        open: "I saw the reminders option when I set up my account. I looked at it and left it off.",
        deep: "I opened the settings in spring. It's one message for everybody, sent on day one after the due date, and I can't change a word of it. A magazine that always pays on day forty would get the same email as a new client. So I left it off and kept my Friday list.",
        exampleQuestion:
          "When you looked at the reminders setting, what did you see and what did you do?",
      },
      {
        id: "tracking",
        label: "Knowing what was paid",
        keywords: [
          "bank",
          "check",
          "track",
          "status",
          "know",
          "opened",
          "seen",
          "received",
          "notif",
          "balance",
        ],
        surface: "I check my bank account, yes.",
        open: "I look at my bank most mornings to see if anything came in. Ledgerline tells me an invoice was sent, and that's about all I know.",
        deep: "Two weeks ago I chased an invoice that, it turned out, the client had never opened: it was sitting in a shared inbox nobody reads. I only found out because I asked. If I'd known it was unopened I would have written on day three, not day thirty.",
        exampleQuestion:
          "Walk me through how you checked whether your last invoice had been paid.",
      },
      {
        id: "pricing",
        label: "Price and plan",
        keywords: [
          "price",
          "cost",
          "expens",
          "plan",
          "subscription",
          "fee",
          "worth",
          "cheap",
        ],
        surface: "The price is fine.",
        open: "I pay for the basic plan. For what it does, it's fair.",
        deep: "I renewed in January without thinking about it. It's less than one hour of my work a month. Price has never been the issue.",
        exampleQuestion:
          "What went through your mind the last time your plan renewed?",
      },
    ],
    findings: [
      {
        id: "few_clients",
        supported: true,
        topicId: "clients",
        why: "Three clients are about 80% of his income, and he said he will not risk those relationships over a cold automatic email.",
      },
      {
        id: "chases_by_hand",
        supported: true,
        topicId: "chasing",
        why: "He keeps a list, chases on Fridays and invents an accountant to make asking easier: the need is there, the feature does not meet it.",
      },
      {
        id: "cash_flow",
        supported: true,
        topicId: "late",
        why: "A payment 47 days late put his rent on a credit card. He said chasing takes ten minutes; the uncertainty is the problem.",
      },
      {
        id: "cannot_edit",
        supported: true,
        topicId: "reminders",
        why: "He found the setting and rejected it: one fixed message for every client, on a fixed day.",
      },
      {
        id: "bank_checking",
        supported: true,
        topicId: "tracking",
        why: "He chased an invoice the client had never opened, and would have acted weeks earlier had he known.",
      },
      {
        id: "not_found",
        supported: false,
        topicId: null,
        why: "The team's assumption, and wrong: he saw the option when he set up his account.",
      },
      {
        id: "would_pay_fees",
        supported: false,
        topicId: null,
        why: "At most a polite 'sure' to a hypothetical. Everything he described is about protecting client relationships, which late fees would damage.",
      },
      {
        id: "forgets_invoices",
        supported: false,
        topicId: null,
        why: "He invoices the day he delivers, always.",
      },
      {
        id: "too_expensive",
        supported: false,
        topicId: null,
        why: "He says the price is fair and has never been the issue.",
      },
    ],
    replies: {
      greeting:
        "Hey, hi. I've got a deadline tonight, but I can give you twenty minutes.",
      leading: LEADING_REPLIES,
      hypothetical: [
        "Sure, that could be useful, I guess.",
        "Maybe, yeah. I'd have to see it.",
        "Sounds fine. I'd probably try it.",
      ],
      offTopic: [
        "Not sure what to say about that. Ask me about invoices and getting paid, that I know.",
        "Honestly I haven't thought about that.",
      ],
    },
    principle:
      "When people do not use a feature, find out what they do instead. The workaround shows the real requirement, and it is rarely 'make the button bigger'.",
  },
};

const priya: InterviewCase = {
  id: "user-interview-priya-churn-risk",
  moduleId: "user-interview",
  seed: 91_303,
  difficulty: "senior",
  company: {
    name: "Docketly",
    industry: "SaaS B2B",
    stage: "Series A, 9,000 paying teams",
    description:
      "Shared task boards for small and mid-sized teams. Larger customers pay per seat on yearly contracts.",
  },
  title: "A big account is going quiet. Find out why.",
  brief:
    "Usage at a 60-seat logistics customer has fallen by half in three months, and the contract renews in eight weeks. The account manager says the customer 'seems happy'. You have a call with the person who brought Docketly in. She is polite and will not volunteer bad news.",
  persona: {
    name: "Priya Shah",
    role: "Head of Operations, logistics company, 60 people",
    context:
      "Chose Docketly two years ago and rolled it out herself. Professional and careful: she answers what she is asked.",
  },
  researchGoal:
    "Find out why her teams use Docketly less, and what will decide the renewal.",
  findings: [
    {
      id: "weekly_report",
      text: "Leadership wants a weekly report Docketly cannot export, so she rebuilds it in a spreadsheet every Monday",
    },
    {
      id: "spreadsheet_first",
      text: "Since the report lives in a spreadsheet, dispatchers update the spreadsheet first and the boards go stale",
    },
    {
      id: "shared_login",
      text: "Contractors shared one login until a security audit stopped it, and now they work outside the tool",
    },
    {
      id: "notifications",
      text: "People muted notifications after getting over a hundred a day, and a delivery was missed",
    },
    {
      id: "proof_of_value",
      text: "The CFO wants proof of value at renewal, and she has no numbers to show",
    },
    {
      id: "hard_to_use",
      text: "Her teams find Docketly hard to use",
    },
    {
      id: "price",
      text: "Price is the main reason she might leave",
    },
    {
      id: "ai_planning",
      text: "She would stay if Docketly added AI planning",
    },
    {
      id: "mobile",
      text: "The mobile app is what drivers complain about",
    },
  ],
  hidden: {
    guarded: true,
    topics: [
      {
        id: "overview",
        label: "How it is going",
        keywords: [
          "going",
          "overall",
          "meeting",
          "planning",
          "general",
          "happy",
          "satisf",
          "experience",
          "feel",
          "think",
          "docketly",
          "team",
        ],
        surface: "It's going fine, thank you.",
        open: "Overall it's fine. We've had Docketly for two years and people know it well. There are always things one could improve.",
        deep: "Last quarter was mixed, to be honest. Dispatch used to live in Docketly. In the last planning meeting I noticed half the room had a spreadsheet open instead.",
        exampleQuestion:
          "Take me through your last planning meeting. What did people have open?",
      },
      {
        id: "reporting",
        label: "Reporting to leadership",
        keywords: [
          "report",
          "ceo",
          "leadership",
          "export",
          "pdf",
          "monday",
          "weekly",
          "management",
          "dashboard",
        ],
        surface: "Yes, I report to the CEO weekly.",
        open: "The CEO likes a weekly summary of deliveries and delays. I prepare that myself.",
        deep: "Every Monday I spend about three hours copying numbers out of Docketly into a spreadsheet, because the CEO wants one page as a PDF and Docketly can't export one. I've done it every week since January.",
        exampleQuestion:
          "How did you put together last Monday's report for the CEO?",
      },
      {
        id: "usage",
        label: "Why usage dropped",
        keywords: [
          "usage",
          "use",
          "drop",
          "less",
          "spreadsheet",
          "excel",
          "dispatch",
          "stale",
          "update",
          "adopt",
          "stop",
        ],
        surface: "Some teams use it a bit less, yes.",
        open: "Dispatch has drifted back to spreadsheets somewhat. Habits, I suppose.",
        deep: "It started with my Monday report. Once that spreadsheet existed, the dispatchers began updating it directly, since that is what the CEO reads. Three weeks ago I opened the dispatch board in Docketly and half the tasks were a fortnight out of date.",
        exampleQuestion:
          "Tell me about the last time you opened the dispatch board.",
      },
      {
        id: "contractors",
        label: "Contractors and access",
        keywords: [
          "contractor",
          "driver",
          "access",
          "login",
          "permission",
          "security",
          "audit",
          "seat",
          "guest",
          "account",
          "external",
        ],
        surface: "Our contractors don't have their own accounts, no.",
        open: "About a third of our drivers are contractors. Giving them access has always been a little awkward.",
        deep: "We couldn't give contractors a limited view, so twenty of them shared one login. In September our security audit flagged it and I had to switch that login off the same day. Since then they get their jobs by phone and text, and none of that reaches Docketly.",
        exampleQuestion:
          "What happened with contractor access after your last security audit?",
      },
      {
        id: "alerts",
        label: "Notifications",
        keywords: [
          "notif",
          "alert",
          "email",
          "mute",
          "miss",
          "noise",
          "delivery",
          "incident",
          "late",
          "problem",
          "wrong",
        ],
        surface: "Notifications are a bit much sometimes.",
        open: "People get a lot of notifications. Most have learned to tune them out.",
        deep: "A dispatcher counted a hundred and forty notifications in one day, so the team muted them. In October a customer changed a delivery address, the update went into Docketly, nobody saw it and the truck went to the old address. That one cost us a client meeting.",
        exampleQuestion:
          "Tell me about the last time something was missed. What happened?",
      },
      {
        id: "renewal",
        label: "The renewal",
        keywords: [
          "renew",
          "contract",
          "cfo",
          "budget",
          "value",
          "roi",
          "decision",
          "decide",
          "finance",
          "justify",
          "price",
          "cost",
        ],
        surface: "The renewal is coming up, yes. The price is fine.",
        open: "Renewal goes through our CFO this year, like every tool. The price itself is not a concern.",
        deep: "Last month the CFO asked me for evidence that Docketly is worth sixty seats: hours saved, fewer late deliveries, anything. I had nothing I could put on a slide, and with usage where it is I didn't want to guess. He asked me to come back with numbers before the renewal.",
        exampleQuestion:
          "How did your last conversation with the CFO about tools go?",
      },
      {
        id: "ease",
        label: "Ease of use",
        keywords: [
          "easy",
          "hard",
          "difficult",
          "usab",
          "learn",
          "confus",
          "interface",
          "design",
          "mobile",
          "app$",
          "train",
        ],
        surface: "No, it's easy to use.",
        open: "People find it easy. New dispatchers pick it up in a day, and nobody has complained about the mobile app.",
        deep: "Our last new dispatcher, in August, was working in Docketly by her second morning without any training. Ease of use is the reason I chose it in the first place.",
        exampleQuestion:
          "How did your most recent new dispatcher learn the interface?",
      },
    ],
    findings: [
      {
        id: "weekly_report",
        supported: true,
        topicId: "reporting",
        why: "Three hours every Monday since January, because the CEO wants a one-page PDF that Docketly cannot export.",
      },
      {
        id: "spreadsheet_first",
        supported: true,
        topicId: "usage",
        why: "The root of the drop: the report spreadsheet became the place the CEO reads, so dispatchers update it first.",
      },
      {
        id: "shared_login",
        supported: true,
        topicId: "contractors",
        why: "Twenty contractors lost access the day the audit flagged the shared login, and their work left the tool.",
      },
      {
        id: "notifications",
        supported: true,
        topicId: "alerts",
        why: "140 notifications a day led the team to mute them, and a changed delivery address was missed.",
      },
      {
        id: "proof_of_value",
        supported: true,
        topicId: "renewal",
        why: "What decides the renewal: the CFO asked for numbers and she has none to show.",
      },
      {
        id: "hard_to_use",
        supported: false,
        topicId: null,
        why: "She says the opposite: new dispatchers are productive in a day.",
      },
      {
        id: "price",
        supported: false,
        topicId: null,
        why: "She said twice that price is not a concern. The risk is that she cannot prove the value.",
      },
      {
        id: "ai_planning",
        supported: false,
        topicId: null,
        why: "At most a polite answer to a hypothetical. None of her problems is about planning.",
      },
      {
        id: "mobile",
        supported: false,
        topicId: null,
        why: "Nobody has complained about the mobile app. Contractors stopped using Docketly because their login was switched off.",
      },
    ],
    replies: {
      greeting: "Good morning. Thank you for making the time.",
      leading: [
        "I suppose that's fair.",
        "Yes, one could say that.",
        "Possibly, yes.",
      ],
      hypothetical: [
        "That sounds interesting. We would certainly look at it.",
        "Possibly. It would depend on the details.",
        "I imagine the team would find that useful.",
      ],
      offTopic: [
        "I'm not sure I can speak to that. Was there something specific about our operations?",
        "I don't have a view on that, I'm afraid.",
      ],
    },
    principle:
      "A careful customer answers the question asked. General questions get general reassurance; questions about a specific meeting, report or incident get the facts that explain the numbers.",
  },
};

export const interviewCases: readonly InterviewCase[] = [maya, tomas, priya];
