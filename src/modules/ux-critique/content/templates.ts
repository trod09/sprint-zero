/**
 * Screen templates. Each region has a good version and the flawed versions
 * it can take; a case flaws a few regions and keeps the rest good, so clean
 * regions are there to tempt false alarms.
 *
 * Text may use {product}. Props are plain visual values read by the
 * template's renderer in `components/screens`.
 */
import type { IssueType, RegionProps, TemplateKey } from "../schema";

export interface FlawTemplate {
  props: RegionProps;
  explanation: string;
  fix: string;
}

export interface RegionTemplate {
  id: string;
  label: string;
  good: RegionProps;
  flaws: Partial<Record<IssueType, FlawTemplate>>;
}

export interface ScreenTemplate {
  key: TemplateKey;
  userGoal: string;
  regions: readonly RegionTemplate[];
}

const signup: ScreenTemplate = {
  key: "signup",
  userGoal:
    "A visitor who clicked 'Start free trial' on the {product} website wants to create an account and get into the product.",
  regions: [
    {
      id: "header",
      label: "Header",
      good: { links: ["Product", "Pricing", "Log in"] },
      flaws: {},
    },
    {
      id: "title",
      label: "Title and subtitle",
      good: {
        heading: "Create your {product} account",
        subtitle: "Start your 14-day free trial. No credit card needed.",
        headingSize: "large",
      },
      flaws: {
        hierarchy: {
          props: {
            heading: "Create your {product} account",
            subtitle: "Start your 14-day free trial. No credit card needed.",
            headingSize: "small",
            subtitleFirst: true,
          },
          explanation:
            "The title is the same size and weight as body text, and the subtitle comes before it, so nothing tells the eye where the page starts or what it is for.",
          fix: "Make the title the largest, boldest text on the page and put it first, with the subtitle below in a lighter style.",
        },
      },
    },
    {
      id: "social",
      label: "Social sign-up buttons",
      good: {
        buttons: ["Continue with Google", "Continue with Apple"],
        showLabels: true,
      },
      flaws: {
        labels: {
          props: {
            buttons: ["Continue with Google", "Continue with Apple"],
            showLabels: false,
          },
          explanation:
            "The sign-up buttons are bare logos with no text. People have to guess what they do, and screen readers announce nothing useful.",
          fix: "Label each button with its action, e.g. 'Continue with Google', next to the logo.",
        },
      },
    },
    {
      id: "form",
      label: "Sign-up form",
      good: {
        fields: ["Work email", "Full name", "Password"],
        labelStyle: "above",
        hint: "At least 8 characters.",
      },
      flaws: {
        long_form: {
          props: {
            fields: [
              "Work email",
              "Full name",
              "Company",
              "Job title",
              "Company size",
              "Phone number",
              "Country",
              "Date of birth",
              "How did you hear about us?",
              "Password",
              "Confirm password",
            ],
            labelStyle: "above",
            hint: "At least 8 characters.",
          },
          explanation:
            "Eleven fields before someone can even try the product. Most of them (date of birth, company size, how did you hear about us) are for the sales team, not for the user, and every extra field costs sign-ups.",
          fix: "Ask only for email and password (or name) at sign-up, and collect the rest later, when it is useful to the user.",
        },
        labels: {
          props: {
            fields: ["Work email", "Full name", "Password"],
            labelStyle: "placeholder",
            hint: "",
          },
          explanation:
            "The field names live only in the placeholders, which disappear as soon as you type. The password rules are not shown at all, so people find them out from an error.",
          fix: "Put a visible label above each field and show the password rules before the user types.",
        },
      },
    },
    {
      id: "consent",
      label: "Terms checkbox",
      good: {
        text: "I agree to the Terms of Service and Privacy Policy.",
      },
      flaws: {
        copy: {
          props: {
            text: "By proceeding you accede to the processing of PII pursuant to Art. 6(1)(a) and the DPA, incl. onward transfers to sub-processors.",
          },
          explanation:
            "The consent text is legal jargon ('accede', 'PII', 'Art. 6(1)(a)', 'sub-processors'). People tick it without understanding what they agree to, which helps neither them nor the company.",
          fix: "Say it in plain words ('I agree to the Terms and the Privacy Policy') and link to the details.",
        },
      },
    },
    {
      id: "actions",
      label: "Buttons under the form",
      good: {
        primary: "Create account",
        secondary: "Already have an account? Log in",
        secondaryStyle: "link",
        onSubmit: "Check your inbox: we sent you a link to confirm your email.",
      },
      flaws: {
        cta: {
          props: {
            primary: "Submit",
            secondary: "Continue",
            secondaryStyle: "primary",
            onSubmit:
              "Check your inbox: we sent you a link to confirm your email.",
          },
          explanation:
            "Two buttons look exactly the same and say 'Submit' and 'Continue'. Neither says what happens, and nothing shows which one creates the account.",
          fix: "One primary button that names the outcome ('Create account'); turn the other action into a secondary link.",
        },
        feedback: {
          props: {
            primary: "Create account",
            secondary: "Already have an account? Log in",
            secondaryStyle: "link",
            onSubmit: "",
          },
          explanation:
            "Clicking 'Create account' does nothing visible: no loading state, no confirmation, no next step. People click again, or leave thinking it is broken.",
          fix: "Show progress while the account is created, then confirm what happened and what to do next ('Check your inbox').",
        },
      },
    },
    {
      id: "trial_note",
      label: "Note under the buttons",
      good: {
        text: "Your trial ends after 14 days. We will remind you 3 days before, and nothing is charged unless you choose a plan.",
        tone: "normal",
      },
      flaws: {
        contrast: {
          props: {
            text: "After 14 days your trial converts to the Pro plan at $24 per month unless cancelled.",
            tone: "faint",
          },
          explanation:
            "The one sentence that says people will be charged is pale grey on white, in tiny type. Its contrast is far below what most people can read comfortably, and it hides the most important information on the page.",
          fix: "Show billing terms in normal body text with enough contrast (at least 4.5:1), next to the button.",
        },
      },
    },
  ],
};

const checkout: ScreenTemplate = {
  key: "checkout",
  userGoal:
    "A {product} customer with a full cart wants to choose delivery, pay and get their order.",
  regions: [
    {
      id: "header",
      label: "Header",
      good: { steps: ["Cart", "Delivery", "Payment"], current: 1 },
      flaws: {},
    },
    {
      id: "shipping",
      label: "Delivery address form",
      good: {
        fields: ["Full name", "Address", "City", "Postcode", "Phone"],
        labelStyle: "above",
      },
      flaws: {
        long_form: {
          props: {
            fields: [
              "Title",
              "First name",
              "Middle name",
              "Last name",
              "Date of birth",
              "Gender",
              "Address line 1",
              "Address line 2",
              "City",
              "County",
              "Postcode",
              "Phone",
              "Second phone",
            ],
            labelStyle: "above",
          },
          explanation:
            "Thirteen fields to deliver groceries, including date of birth, gender and a second phone that delivery does not need. Each one is a reason to abandon the cart at the last step.",
          fix: "Ask only what delivery needs, prefill what you already know, and offer address lookup.",
        },
        labels: {
          props: {
            fields: ["Full name", "Address", "City", "Postcode", "Phone"],
            labelStyle: "placeholder",
          },
          explanation:
            "Field names are placeholders that vanish on typing, so people who check their address before paying cannot tell which line is which.",
          fix: "Keep visible labels above the fields.",
        },
      },
    },
    {
      id: "delivery",
      label: "Delivery options",
      good: {
        options: [
          "Standard · arrives Thursday · Free",
          "Express · arrives tomorrow · $4.99",
        ],
      },
      flaws: {
        copy: {
          props: {
            options: [
              "Option A (SLA-72, non-tracked)",
              "Option B (P1 courier, tier 2 surcharge)",
            ],
          },
          explanation:
            "The delivery options use internal jargon ('SLA-72', 'P1 courier', 'tier 2 surcharge') and never say when the order arrives or what it costs, which is all the customer wants to know.",
          fix: "Describe each option by arrival date and price, in the customer's words.",
        },
      },
    },
    {
      id: "promo",
      label: "Promo code",
      good: { result: "Code SAVE10 applied: −$4.20" },
      flaws: {
        feedback: {
          props: { result: "" },
          explanation:
            "Applying a promo code gives no sign of success or failure, and the total does not visibly change. People retype the code or leave to search for another one.",
          fix: "Confirm the code inline, show the discount as a line in the summary, and explain clearly when a code is not valid.",
        },
      },
    },
    {
      id: "summary",
      label: "Order summary",
      good: {
        lines: [
          ["Items (12)", "$38.81"],
          ["Delivery", "Free"],
          ["Service fee", "$0.99"],
        ],
        total: "$39.80",
        totalStyle: "emphasized",
      },
      flaws: {
        hierarchy: {
          props: {
            lines: [
              ["Items (12)", "$38.81"],
              ["Total", "$39.80"],
              ["Delivery", "Free"],
              ["Service fee", "$0.99"],
            ],
            total: "",
            totalStyle: "plain",
          },
          explanation:
            "The total sits in the middle of the list, in the same style as every other line. The number people must check before paying is the hardest one to find.",
          fix: "Put the total last, separated from the lines above, in larger and bolder type.",
        },
      },
    },
    {
      id: "place_order",
      label: "Payment buttons",
      good: {
        primary: "Pay $39.80",
        secondary: "Back to cart",
        secondaryStyle: "link",
        secondaryEffect: "none",
      },
      flaws: {
        cta: {
          props: {
            primary: "Continue",
            secondary: "Next",
            secondaryStyle: "primary",
            secondaryEffect: "none",
          },
          explanation:
            "Two identical buttons, 'Continue' and 'Next', on the last step. Neither says that it will charge the card, so people hesitate or pick at random.",
          fix: "One primary button that states the outcome and amount ('Pay $39.80'), and a quiet link to go back.",
        },
        destructive: {
          props: {
            primary: "Pay $39.80",
            secondary: "Empty cart",
            secondaryStyle: "primary",
            secondaryEffect: "empty",
          },
          explanation:
            "'Empty cart' sits right next to 'Pay' and looks just like it. One slip deletes the whole order, with no confirmation and no undo.",
          fix: "Move destructive actions away from the primary one, style them as secondary, and confirm or allow undo.",
        },
      },
    },
    {
      id: "footer_note",
      label: "Returns note",
      good: {
        text: "Missing or damaged items? Report them in the app within 48 hours for a full refund.",
        tone: "normal",
      },
      flaws: {
        contrast: {
          props: {
            text: "Missing or damaged items must be reported within 48 hours or refunds are not possible.",
            tone: "faint",
          },
          explanation:
            "The refund deadline is in pale grey, tiny text that fails contrast guidelines. People only discover it after the 48 hours have passed.",
          fix: "Show policies that cost the customer money in readable text with enough contrast.",
        },
      },
    },
  ],
};

const settings: ScreenTemplate = {
  key: "settings",
  userGoal:
    "A {product} admin wants to update their profile, choose which notifications they get and check their plan.",
  regions: [
    {
      id: "page_title",
      label: "Page title and tabs",
      good: {
        title: "Settings",
        tabs: ["Profile", "Notifications", "Billing"],
        titleSize: "large",
      },
      flaws: {
        hierarchy: {
          props: {
            title: "Settings",
            tabs: ["Profile", "Notifications", "Billing"],
            titleSize: "small",
            sectionSize: "large",
          },
          explanation:
            "The page title is smaller than the section headings below it, so the structure reads upside down and nothing anchors where you are.",
          fix: "Keep a clear scale: page title largest, then section headings, then labels.",
        },
      },
    },
    {
      id: "profile",
      label: "Profile fields",
      good: { fields: ["Name", "Email", "Job title"], labelStyle: "above" },
      flaws: {
        labels: {
          props: {
            fields: ["Name", "Email", "Job title"],
            labelStyle: "none",
          },
          explanation:
            "The profile fields are filled in but have no labels, so you cannot tell which value is which field, especially when one is empty.",
          fix: "Give every field a visible label.",
        },
      },
    },
    {
      id: "notifications",
      label: "Notification toggles",
      good: {
        toggles: [
          "Email me when I am assigned a task",
          "Daily summary of my tasks",
          "Mentions in comments",
        ],
        showLabels: true,
      },
      flaws: {
        labels: {
          props: {
            toggles: [
              "Email me when I am assigned a task",
              "Daily summary of my tasks",
              "Mentions in comments",
            ],
            showLabels: false,
          },
          explanation:
            "The toggles are identified only by small icons (an envelope, a calendar, a speech bubble), so people switch notifications on and off by guessing.",
          fix: "Write what each toggle does next to it.",
        },
      },
    },
    {
      id: "plan",
      label: "Plan section",
      good: {
        lines: ["Business plan · 12 seats", "Renews on March 3 · $240/month"],
        action: "Manage plan",
      },
      flaws: {
        copy: {
          props: {
            lines: [
              "Entitlement: SKU-B2-12 (seat-provisioned)",
              "Term end: T+90 · auto-renew flag: 1",
            ],
            action: "Modify provisioning",
          },
          explanation:
            "The plan is described with internal billing codes ('SKU-B2-12', 'T+90', 'auto-renew flag: 1'). The admin cannot tell what they pay, for how many people, or when it renews.",
          fix: "Name the plan, the number of seats, the price and the renewal date in plain words.",
        },
      },
    },
    {
      id: "save_row",
      label: "Save button",
      good: { label: "Save changes", onSave: "Changes saved." },
      flaws: {
        feedback: {
          props: { label: "Save changes", onSave: "" },
          explanation:
            "Clicking 'Save changes' shows nothing: no spinner, no confirmation. People cannot tell whether their changes were kept, so they save again or leave unsure.",
          fix: "Confirm the save inline ('Changes saved') and show errors next to the field that failed.",
        },
        cta: {
          props: { label: "OK", onSave: "Changes saved." },
          explanation:
            "The only button on a long settings page says 'OK'. It does not say that it saves, so people leave without saving, or press it expecting to close something.",
          fix: "Label the button with its action: 'Save changes'.",
        },
      },
    },
    {
      id: "danger",
      label: "Delete workspace",
      good: {
        label: "Delete workspace",
        style: "outline-danger",
        confirm: true,
      },
      flaws: {
        destructive: {
          props: {
            label: "Delete workspace",
            style: "primary",
            confirm: false,
          },
          explanation:
            "Deleting the whole workspace is a big, brand-colored button that looks like the main action and works on a single click, with no confirmation and no undo.",
          fix: "Put irreversible actions in a separate danger zone, style them as destructive, and ask for confirmation (e.g. typing the workspace name).",
        },
      },
    },
    {
      id: "help_text",
      label: "Note under the toggles",
      good: {
        text: "Notification changes apply to every workspace you belong to.",
        tone: "normal",
      },
      flaws: {
        contrast: {
          props: {
            text: "Notification changes apply to every workspace you belong to.",
            tone: "faint",
          },
          explanation:
            "An important note about the scope of the change is pale grey on white, below the minimum contrast for body text.",
          fix: "Show the note in readable secondary text with at least 4.5:1 contrast.",
        },
      },
    },
  ],
};

export const SCREEN_TEMPLATES: Record<TemplateKey, ScreenTemplate> = {
  signup,
  checkout,
  settings,
};
