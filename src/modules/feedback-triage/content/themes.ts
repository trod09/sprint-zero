/**
 * Hand-written feedback, grouped by the theme it really belongs to. Texts
 * use slots that each product fills: {product}, {item}, {items},
 * {coreAction}, {plan}, {feature}, {device}.
 *
 * A case picks six themes, takes a seeded number of texts from each, and adds
 * its own critical problem and some noise.
 */
import type { Severity } from "../schema";

export interface ThemeTemplate {
  key: string;
  label: string;
  severity: Exclude<Severity, "critical">;
  /** What is really behind the theme, for the results page. */
  summary: string;
  /** An example opportunity a strong PM would write. */
  opportunity: string;
  texts: readonly string[];
}

export const THEME_LIBRARY = {
  performance: {
    key: "performance",
    label: "The app got slow",
    severity: "medium",
    summary:
      "Load times and responsiveness got worse over recent releases. It annoys everyone a little and pushes some people away, but nobody is blocked.",
    opportunity:
      "How might we make opening {product} and loading {items} feel instant again, with a load-time budget every release has to meet?",
    texts: [
      "{product} takes forever to load lately. I open it and stare at a spinner for ten seconds.",
      "Everything feels sluggish since the last update. Scrolling through my {items} stutters.",
      "Why is the app so slow now? It used to be instant.",
      "Loading my {items} takes almost a minute on wifi. Something is wrong.",
      "Super laggy on my {device}. Typing has a delay.",
      "The app freezes for a few seconds every time I switch tabs.",
      "Great idea, terrible speed. I gave up waiting to {coreAction} this morning.",
      "Performance has gotten worse with every release this year.",
      "It's slow to start and slow to sync. Please fix the speed.",
      "Search is painfully slow, I can type my query faster than it returns.",
      "Battery drains fast and the phone gets hot while the app loads.",
      "Opening a single {item} takes several seconds now.",
      "Lag, lag, lag. Unusable on my commute.",
      "Pages load in slow motion compared to a month ago.",
    ],
  },
  login: {
    key: "login",
    label: "People cannot log in",
    severity: "high",
    summary:
      "Password resets, verification codes and social sign-in fail, and people are locked out of their own data. Every one of these users is fully blocked.",
    opportunity:
      "How might we make sure nobody stays locked out of {product}, with sign-in and recovery that work on the first try?",
    texts: [
      "I keep getting logged out and the reset email never arrives.",
      "Can't log in since yesterday. It says my password is wrong but I reset it twice.",
      "The verification code text never comes, so I'm locked out of {product}.",
      "Sign in with Google just spins and sends me back to the start screen.",
      "Locked out of my account for three days now. Nobody has helped.",
      "Every time I open the app I have to log in again.",
      "The two-factor code expired before it arrived. Now I'm stuck.",
      "Login loop on my {device}: enter password, back to the login screen.",
      "I can't get into my account to {coreAction}. Please help.",
      "The 'forgot password' link goes to a broken page.",
      "Logged out after the update and none of my passwords work.",
      "Sign in with Apple fails with 'something went wrong'.",
      "I can't reach my {items} because login keeps failing.",
      "My session expires every few minutes, I have to sign in constantly.",
    ],
  },
  pricing: {
    key: "pricing",
    label: "The price feels too high",
    severity: "low",
    summary:
      "Complaints about the price and the last increase. Loud and frequent, but people still use the product; it is a positioning question, not a broken experience.",
    opportunity:
      "How might we make the value of {plan} obvious before renewal, so the price feels earned?",
    texts: [
      "Too expensive for what it does. {plan} should be half the price.",
      "The price went up again and I didn't get anything new for it.",
      "I'd pay for {plan} if there was a monthly option under $5.",
      "Why did my renewal cost 30% more than last year?",
      "Love the app but I can't justify the subscription anymore.",
      "Other apps do this for free. Hard to keep paying.",
      "Student discount please, {plan} is too pricey.",
      "The free tier keeps shrinking. Feels like a push to pay.",
      "Pricing is confusing, I don't even know which plan I'm on.",
      "Cancelled {plan} because of the price increase.",
      "Make the annual plan cheaper and I'll stay.",
      "Paying this much, I expected more than the basics.",
      "A price hike without warning is not cool.",
      "Wish there was a family plan, paying for three accounts adds up.",
    ],
  },
  notifications: {
    key: "notifications",
    label: "Too many notifications",
    severity: "low",
    summary:
      "Push and email volume annoys people. Easy to fix and worth fixing, but it does not stop anyone from using the product.",
    opportunity:
      "How might we let people choose which notifications they get, and send fewer that matter more?",
    texts: [
      "Way too many push notifications. I turned them all off.",
      "Stop sending me reminders every single day.",
      "I get three emails a day from {product}. Unsubscribed.",
      "Notifications at 6am on a Sunday? No thanks.",
      "Can I choose which notifications I get? It's all or nothing right now.",
      "The app nags me constantly to {coreAction}.",
      "Muted the app because of the spammy alerts.",
      "My notification settings don't save, I keep getting everything.",
      "Too many 'we miss you' messages.",
      "Every update brings a new kind of notification I didn't ask for.",
      "The badge count never clears, even after I read everything.",
      "Please stop the marketing pushes, I only want the important ones.",
    ],
  },
  feature_request: {
    key: "feature_request",
    label: "Requests for {feature}",
    severity: "low",
    summary:
      "A popular request. It signals what people want next, but its absence does not hurt anyone today.",
    opportunity:
      "How might we find out which job {feature} would do for people, and whether a smaller version solves it?",
    texts: [
      "Please add {feature}. It's the one thing missing.",
      "I would switch to {plan} in a heartbeat if you had {feature}.",
      "Any plans for {feature}? I've been waiting a year.",
      "{feature} would make this perfect.",
      "Other apps have {feature}, why doesn't {product}?",
      "Requesting {feature} again. Please.",
      "My team needs {feature} before we can roll {product} out.",
      "The only thing I miss is {feature}.",
      "Five stars once {feature} arrives.",
      "Can you prioritize {feature}? Upvote from me.",
      "I'd use {product} daily if it had {feature}.",
      "Still no {feature}? Come on.",
    ],
  },
  onboarding: {
    key: "onboarding",
    label: "Getting started is confusing",
    severity: "medium",
    summary:
      "New users struggle with the first steps. It costs activation quietly: these people rarely complain twice, they just leave.",
    opportunity:
      "How might we get a new user to {coreAction} in their first two minutes, without a tutorial?",
    texts: [
      "Downloaded it and had no idea where to start.",
      "The setup asks too many questions before I can even {coreAction}.",
      "The tutorial is way too long and I couldn't skip it.",
      "It took me twenty minutes to figure out how to {coreAction}.",
      "New user here, the first screens are confusing.",
      "I signed up but couldn't find how to add my first {item}.",
      "The welcome tour covers everything except what I needed.",
      "Too many permissions asked at the start, I almost uninstalled.",
      "Not intuitive at all for a beginner.",
      "Gave up during setup. Maybe I'll try again later.",
      "The empty screen after signing up tells me nothing.",
      "Onboarding forced me to invite people before I could continue.",
    ],
  },
  support: {
    key: "support",
    label: "Support is slow",
    severity: "medium",
    summary:
      "Slow or unhelpful support. It multiplies the pain of every other problem, but it is a symptom as much as a cause.",
    opportunity:
      "How might we answer the most common questions before people need to contact us, and reply to the rest within a day?",
    texts: [
      "Emailed support a week ago, still no answer.",
      "Support closed my ticket without solving anything.",
      "Chat support is a bot that goes in circles. I need a human.",
      "Third time explaining the same problem to a new agent.",
      "Support replied with a help article that doesn't apply to me.",
      "No phone number, no live chat, just a form.",
      "Waiting five days for a reply as a paying {plan} customer is unacceptable.",
      "The help center is out of date, the screenshots show the old app.",
      "Your support team promised a callback that never came.",
      "Ticket marked 'resolved' but nobody contacted me.",
      "It took two weeks to get an answer about a refund.",
      "Support hours don't work for anyone outside the US.",
    ],
  },
  crashes: {
    key: "crashes",
    label: "The app crashes",
    severity: "high",
    summary:
      "Crashes in core flows. People lose work and cannot finish what they came to do.",
    opportunity:
      "How might we catch crashes in core flows before release, and fix the top crash signatures this sprint?",
    texts: [
      "The app crashes every time I try to {coreAction}.",
      "Crashes on launch since the latest update on my {device}.",
      "It closes itself randomly in the middle of what I'm doing.",
      "Crashed three times today. I lost what I was typing.",
      "Can't use it at all, it crashes right after the splash screen.",
      "Opening a {item} makes the app crash.",
      "Constant crashes on my {device}, reinstalling didn't help.",
      "The app force closes when I rotate the screen.",
      "It crashes whenever I attach a photo.",
      "Since the update it crashes in the background and drains my battery.",
      "Unstable. It crashes at least once a day.",
      "Crash when I tap the share button, every single time.",
      "It crashes when I switch accounts.",
      "Five crashes in an hour. Please test before releasing.",
    ],
  },
  upsell: {
    key: "upsell",
    label: "Upsells are pushy",
    severity: "low",
    summary:
      "Upgrade prompts feel aggressive. It erodes goodwill, but nobody is blocked.",
    opportunity:
      "How might we show {plan} at the moment someone needs it, instead of on every screen?",
    texts: [
      "Every other screen is an upsell to {plan}.",
      "The 'upgrade' popup appears every time I open the app.",
      "I paid for {plan} and I still see promos for other plans.",
      "Too many prompts to rate the app and upgrade.",
      "The upgrade button is right where the save button used to be.",
      "Constant banners for {plan} make the app feel cheap.",
      "I get it, you want me to pay. Stop asking every five minutes.",
      "Ads covering the content on the free plan.",
      "The trial reminder popup can't be dismissed.",
      "It feels like a sales funnel more than an app now.",
    ],
  },
} as const satisfies Record<string, ThemeTemplate>;

export type ThemeKey = keyof typeof THEME_LIBRARY;
export const THEME_KEYS = Object.keys(THEME_LIBRARY) as ThemeKey[];

/** Items that belong to no theme: praise, off-topic and spam. */
export const NOISE_TEXTS: readonly string[] = [
  "Love {product}, I use it every day!",
  "Best app in its category, keep it up.",
  "Five stars, does exactly what I need.",
  "The new design is beautiful.",
  "Thanks to the team, this app changed my routine.",
  "Simple and reliable. No complaints.",
  "ok",
  "meh",
  "Is this the app my cousin told me about?",
  "How do I change the language of my phone?",
  "Wrong app, I meant to review a game. Sorry!",
  "first",
  "Earn $500 a day from home, visit my profile!!!",
  "Free gift cards on my channel, link in bio.",
  "My dog likes the colors.",
  "Can't wait for summer.",
];

/** Noise texts that are positive, for ratings and scores. */
export const PRAISE_TEXT_COUNT = 6;

export const DEVICES: readonly string[] = [
  "iPhone",
  "Android phone",
  "Pixel",
  "iPad",
  "Samsung",
];
