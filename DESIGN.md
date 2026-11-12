---
name: Sprint Zero
description: An arcade cabinet on the outside, a precise PM flight simulator on the inside.
colors:
  start-button-gold: "#ffd23f"
  night-sky-navy: "#0a0e1f"
  cabinet-panel: "#121833"
  console-slate: "#1a2142"
  starlight: "#eef1ff"
  instrument-haze: "#a3acd1"
  frame-periwinkle: "#5f6db0"
  grid-line: "#2c3768"
  signal-blue: "#4c8dff"
  link-blue: "#7fb0ff"
  alarm-red: "#ff5d6c"
  go-green: "#3ddc84"
  caution-orange: "#ff9f1c"
  paper-cream: "#f6f3e8"
  paper-white: "#ffffff"
  paper-shade: "#ece8da"
  paper-rule: "#d3ccb4"
  ink-slate: "#4a5070"
  cobalt: "#1f5bff"
  alarm-red-light: "#c8102e"
  go-green-light: "#12804a"
  caution-orange-light: "#9a4a05"
  module-backlog: "#ff8a3d"
  module-metric-drop: "#2ee6d6"
  module-ab-test: "#a07cff"
  module-feedback-triage: "#ff5fa2"
  module-ux-critique: "#9be15d"
  module-product-case: "#4cc9ff"
  module-prd-writer: "#8c9eff"
  module-roadmap-okrs: "#ffc857"
  module-quick-cases: "#ff7a7a"
  module-user-interview: "#5ee0a0"
  module-stakeholder-arena: "#e0a0ff"
  module-locked: "#5b6488"
typography:
  display:
    fontFamily: "Jersey 10, monospace"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0em"
  headline:
    fontFamily: "Jersey 10, monospace"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "Jersey 10, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.025em"
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-large:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Jersey 10, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.1em"
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  card: "6px"
  device: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.start-button-gold}"
    textColor: "{colors.night-sky-navy}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#ffd85c"
  button-outline:
    backgroundColor: "{colors.cabinet-panel}"
    textColor: "{colors.starlight}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.console-slate}"
  button-ghost:
    textColor: "{colors.starlight}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  chip:
    backgroundColor: "{colors.start-button-gold}"
    textColor: "{colors.night-sky-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
    height: "24px"
  chip-muted:
    backgroundColor: "{colors.console-slate}"
    textColor: "{colors.starlight}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
    height: "24px"
  panel:
    backgroundColor: "{colors.cabinet-panel}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.card}"
    padding: "16px"
  panel-title-bar:
    backgroundColor: "{colors.console-slate}"
    textColor: "{colors.starlight}"
    typography: "{typography.title}"
    padding: "8px 12px 8px 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.cabinet-panel}"
    textColor: "{colors.starlight}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    height: "36px"
  segmented-control:
    backgroundColor: "{colors.console-slate}"
    textColor: "{colors.instrument-haze}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "3px"
    height: "36px"
  segmented-control-selected:
    backgroundColor: "{colors.start-button-gold}"
    textColor: "{colors.night-sky-navy}"
  nav-link:
    textColor: "{colors.instrument-haze}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Sprint Zero

## Overview

**Creative North Star: "The PM Flight Sim"**

Sprint Zero looks like an arcade cabinet and works like a flight simulator. Outside a case (home, worlds, case library, skills, sign-in) the game wears its costume: a night sky over pixel skylines, one colour per world, a mascot, XP and "press start". Inside a case the costume steps back and the instruments take over: framed panels, flat data tables, legible dashboards, a mission bar that says what is left to do. The fun is the wrapper; the judgement being practised is serious, and the screens where it happens read like a professional tool.

Density follows that split. Hub pages breathe and celebrate; case workspaces are dense and calm, with every block in the same framed window so reading material and controls feel like one cockpit. Everything is drawn in hard pixels: 2px frames, solid offset shadows that never blur, motion that steps instead of easing. Dark (the night sky) is the main theme; light is a warm paper variant of the same system, not a different personality.

This system deliberately departs from the "Linear/Amplitude" look named in MASTER_PROMPT.md: that sobriety now lives only inside the cases, never as the overall identity.

**Key Characteristics:**

- Arcade outside, precise inside: game language around the cases, tool language within them.
- Hard pixels: 2px frames, unblurred offset shadows, tight corners, stepped motion.
- One colour per world, used as an accent and never as text.
- Pixel display type for titles, buttons, numbers and short labels; a soft humanist sans for everything you read.
- Tactile controls that sink when pressed, like a cabinet button.

## Colors

A night-sky navy base lit by a single gold action colour, cool instrument greys, and eleven saturated world colours that each belong to one module.

### Primary

- **Start Button Gold** (#ffd23f): the colour of acting and of achieving. Primary buttons, the selected option in a segmented control, default chips, XP and progress fills, and accent text on dark (`--ink`). It is identical in both themes, always with Night Sky Navy text on top.

### Secondary

- **Signal Blue** (#4c8dff dark) / **Cobalt** (#1f5bff light): secondary buttons, the first chart series, and the focus ring in the light theme.
- **Link Blue** (#7fb0ff dark) / **Cobalt** (light): text links and brand text that must read on its background (`--brand`).

### Tertiary: the worlds

One colour per module, set as `--world` on case and results pages: Backlog (#ff8a3d), Metric Drop (#2ee6d6), A/B Test (#a07cff), Feedback Triage (#ff5fa2), UX Critique (#9be15d), Product Case (#4cc9ff), PRD Writer (#8c9eff), Roadmap & OKRs (#ffc857), Quick Cases (#ff7a7a), User Interview (#5ee0a0), Stakeholder Arena (#e0a0ff), and Locked Grey (#5b6488) for anything not yet playable. They colour world banners, module sprites, panel title stripes, tile borders and icons.

### Status

- **Alarm Red** (#ff5d6c dark, #c8102e light): errors, destructive actions, tickets that will not ship.
- **Go Green** (#3ddc84 dark, #12804a light): correct answers, completed objectives, success.
- **Caution Orange** (#ff9f1c dark, #9a4a05 light): warnings, capacity close to the limit.

### Neutral

- **Night Sky Navy** (#0a0e1f): the dark background, text in the light theme, the frame colour in light, and the sky of every pixel scene in both themes.
- **Cabinet Panel** (#121833): cards, panels, inputs and popovers on dark.
- **Console Slate** (#1a2142): muted surfaces on dark (panel title bars, segmented control track, hover fills).
- **Starlight** (#eef1ff): text on dark.
- **Instrument Haze** (#a3acd1): secondary text on dark (subtitles, metadata, inactive navigation).
- **Frame Periwinkle** (#5f6db0): the 2px frame of cards, buttons and inputs on dark.
- **Grid Line** (#2c3768): hairline dividers and borders inside panels on dark.
- **Paper Cream** (#f6f3e8), **Paper White** (#ffffff), **Paper Shade** (#ece8da), **Paper Rule** (#d3ccb4), **Ink Slate** (#4a5070): the light theme's background, cards, muted surfaces, dividers and secondary text.

### Named Rules

**The Start Button Rule.** Gold means "act here" or "you earned this". It fills the one primary action of a view, the selected choice and progress; it never fills large reading areas or decorates. One gold button per screen: every other action is an outline button, and labels such as levels and skills are never gold chips.

**The World Colour Rule.** A world colour marks where you are (stripes, icons, borders, banners) and is never used for text. On light surfaces use the darkened `--world-ink` (62% world colour mixed into Night Sky Navy); on dark the bright colour reads as is.

**The Night Sky Rule.** Pixel scenes (world banners, the sign-in attract screen, sprite plates) are always night, in both themes, so the text drawn on them uses fixed colours rather than theme tokens.

**The AA Pair Rule.** Every foreground and background token pair passes WCAG AA in both themes; `tests/design/tokens.test.ts` enforces it. A new token joins that test.

## Typography

**Display Font:** Jersey 10 (with monospace fallback)
**Body Font:** Nunito (with system-ui, sans-serif)
**Data Font:** Geist Mono (with ui-monospace)

**Character:** A pixel face with plain, readable letterforms (an "S" is an S and a "5" is a 5) sets the game's voice in short bursts, while rounded Nunito carries every sentence a learner has to read. Geist Mono lines up numbers and ids in dense data.

### Hierarchy

- **Display** (Jersey 10, 400, 3–3.75rem, line-height 1): the app name on the attract screen and world banners only, with a hard 4px black text shadow on night scenes.
- **Headline** (Jersey 10, 400, 1.875rem, 1.25): page titles in `PageHeader` and big numbers such as the score.
- **Title** (Jersey 10, 400, 0.875rem, letter-spacing 0.025em): panel title bars, buttons, segmented controls, navigation.
- **Body** (Nunito, 400, 0.875rem, 1.5): tickets, briefs, documents, feedback, form text. Subtitles cap at about 42rem (`max-w-2xl`).
- **Body Large** (Nunito, 400, 1rem, 1.625): case briefs and long-form reading.
- **Label** (Jersey 10, 400, 0.6875–0.75rem, letter-spacing 0.1em, uppercase): eyebrows, chips, small section labels.
- **Data** (Geist Mono, 400, 0.75rem): ticket ids, metric values in tables, code-like strings.

### Named Rules

**The Pixel Label Rule.** Jersey 10 is for titles, buttons, numbers and short labels, never for a sentence. It has one weight: never add `font-semibold` or faux bold (`font-synthesis: none` is set).

**The Cap Height Rule.** The pixel face has short capitals, so it is size-adjusted to a cap height of 0.63 (`font-size-adjust: cap-height 0.63`). Size it by the scale above and let the adjustment do the matching; do not hand-tune sizes to compensate.

## Layout

Pages sit in a single centred container of 72rem (`max-w-6xl`) with 16px gutters on phones and 24px from `sm`. The site header is sticky, 56px tall, with a 2px frame line at its bottom.

Hub pages (home, library, skills, history) start with `PageHeader` and stack generous sections (24–32px apart). Case pages are workspaces: a case header, then a grid that grows to three columns at `xl` when a module has a side document column or the phone product preview (for example `minmax(0,20rem) / 1fr / 19rem`), and collapses to one stacked column below. The mission HUD is sticky at the bottom of every case, 12px above the viewport edge.

Spacing runs on a 4px base: 8px between related controls, 12px inside rows, 16px panel padding, 24px between panels. The desktop is the design target; phones get the same content stacked, never a sideways scroll (enforced by the e2e suite).

## Elevation & Depth

Depth is structural, not atmospheric. Every object that is a thing (a panel, a card, a button) sits on a solid offset shadow in the shadow colour (black on dark, navy on light); nothing is ever blurred. Dense data stays flat. Interactive objects move along the shadow axis: they lift up-left on hover and sink down-right when pressed.

### Shadow Vocabulary

- **Panel** (`box-shadow: 4px 4px 0 0 var(--shadow-color)`): every `pixel-card` and `Panel`.
- **Small** (`box-shadow: 2px 2px 0 0 var(--shadow-color)`): icon plates, small chips that stand alone.
- **Large** (`box-shadow: 6px 6px 0 0 var(--shadow-color)`): hero blocks such as the attract screen, and a lifted card on hover.
- **Button** (`box-shadow: 0 3px 0 0 var(--shadow-color)`): a ledge under each button, growing to 4px on hover and shrinking to 1px when pressed.

### Named Rules

**The Hard Shadow Rule.** Shadows are solid offsets with zero blur. A blurred or coloured glow does not belong in this world.

**The Flat Data Rule.** Tables, ticket lists, dashboards and other dense data use `pixel-frame` (or `Panel flat`): the same frame, no shadow, so the data reads as one plane.

## Shapes

Corners are tight and squared-off: 2px for chips and inputs, 3px for buttons and segmented controls, 4px for the base radius, 6px for cards and panels. Every surface carries a 2px solid frame (Frame Periwinkle on dark, Night Sky Navy on light). Pixel sprites and scenes render with `image-rendering: pixelated` and crisp edges.

The one round object is the phone in product previews: a device bezel with a 32px outer and 24px screen radius, because it depicts real hardware rather than the game's UI. Status dots and avatars may be circles.

**The Tight Corner Rule.** No large radii and no pills: never `rounded-xl` with a hairline border. If it looks soft and floaty, it is out of this world.

## Components

### Buttons

Tactile like cabinet buttons: framed, sitting on a ledge, and sinking when pressed.

- **Shape:** squared-off corners (3px), 2px frame, 36px tall by default (24, 32 and 44px sizes exist).
- **Primary:** Start Button Gold with Night Sky Navy pixel text, padding 0 12px.
- **Hover / Focus:** rises 1px as the ledge grows from 3px to 4px and the fill lightens by 12%; focus shows a 3px ring in the ring colour. Pressed sinks 2px onto a 1px ledge, in about 100ms.
- **Disabled:** a dashed frame on the muted surface with muted text and no ledge, so "not yet" never looks like a broken gold button. The mission HUD's submit uses it until the objectives allow submitting.
- **Secondary:** Signal Blue fill. **Outline:** Cabinet Panel fill, hover to Console Slate; every action that is not the screen's one primary. **Destructive:** framed in Alarm Red on the card colour. **Ghost and Link:** no frame, no ledge, for dense lists and inline actions.

### Chips

- **Style:** 24px tall, 2px frame, 2px corners, pixel label text (11px, tracked). Never rounded pills.
- **State:** gold by default for emphasis; muted (Console Slate) for neutral metadata; outline for counts; destructive framed in Alarm Red.

### Cards / Containers

- **Corner Style:** 6px.
- **Background:** Cabinet Panel on dark, Paper White on light.
- **Shadow Strategy:** the Panel shadow; `pixel-frame` variants are flat (see Elevation).
- **Border:** 2px frame.
- **Internal Padding:** 16px.
- **Clickable cards** add `pixel-lift`: up-left 2px with a 6px shadow on hover, down-right with a 2px shadow when pressed, in two steps over 120ms.

### Inputs / Fields

- **Style:** 36px tall, 2px frame in the input colour, 2px corners, card-coloured background, Nunito text.
- **Focus:** the frame turns to the ring colour with a 3px soft ring.
- **Error / Disabled:** Alarm Red frame and ring when invalid; half opacity when disabled. Selects use `NativeSelect` in the same frame.

### Navigation

- **Style:** a sticky header with the mascot and app name in pixel type, then pixel-font links in Instrument Haze that turn Starlight on a Console Slate fill on hover. Sign-in is a framed link on the right from `sm` up.
- **Mobile:** the link row scrolls sideways inside the header; the app name collapses to the mascot.

### Segmented Control

A framed Console Slate track (3px inset) whose options are pixel-font segments; the selected one fills with Start Button Gold. Used whenever buttons switch what one area shows (planning modes, views, ranges), with radio-group keyboard behaviour.

### Panel (signature)

The window of the game. A framed card whose 44px title bar sits on Console Slate behind a 2px frame line, with a 4px stripe of the world colour on its left edge, a pixel icon in the world ink, the title in pixel type and an optional count or control on the right. Every block inside a case is a Panel, so documents, data and controls share one frame.

### Mission HUD (signature)

A framed card pinned to the bottom of every case: a sprite plate, "Objectives n/m" with a segmented progress bar, the objective checklist (struck through when done, in Go Green), and the single primary button that submits the case. It is the only place the submit action lives.

### World Banner and Case Tile (signature)

Each module is a world drawn as a pixel night scene: stars and two layers of skyline generated from a seed in the module's colour, with the module sprite and name in pixel type. The banner's subtitle sits on a dark plate per line (80% Night Sky Navy) because the terrain behind it can be bright; on phones the sprite is hidden so the text gets the full width. Inside a case the banner carries the module and level as night chips instead of an eyebrow.

Case tiles carry the world colour as a stripe and show the level, the title, the company and the best score. A case not played yet shows three empty stars (the stars to win) on a solid frame; a played one shows its stars and the panel shadow. No "new" badges.

### Results (signature)

Each decision lists every option with its verdict as a framed pixel chip in the verdict colour (best, defensible, weak, harmful). The options the learner picked sit on a 10% gold tint, so "what I chose" is found at a glance.

### Product Preview Phone (signature)

A device frame (dark bezel, notch, status bar, home indicator) showing what customers would see from the learner's choices: a paywall, a store listing, release notes. Its screen is a white consumer app tinted by the world colour, deliberately outside the arcade styling.

## Do's and Don'ts

### Do:

- **Do** build every block inside a case from `Panel` (or `PanelTitleBar`), and use `flat` for dense data.
- **Do** keep gold for the one primary action of a view, selection and progress (The Start Button Rule).
- **Do** use `var(--world-ink)` for world accents on light surfaces, and `var(--world)` only where it is decoration.
- **Do** use solid offset shadows (4px panels, 3px button ledge) and stepped motion: `steps()` timing, 100–240ms.
- **Do** start hub pages with `PageHeader`, and put a case's submit button only in the mission HUD.
- **Do** honour reduced motion: every animation and transition drops to near zero when the user asks.
- **Do** add any new colour pair to the AA token test.
- **Do** theme the browser's own surfaces: text selection is gold on navy, the caret uses the ink colour and scrollbars use the frame colour.
- **Do** keep reading text at 12px or larger; only the simulated phone in product previews goes smaller, because it depicts a real device.

### Don't:

- **Don't** set sentences, paragraphs or form text in Jersey 10, and never give it `font-semibold`.
- **Don't** use `rounded-xl border` cards, rounded pills or blurred shadows.
- **Don't** use a world colour for text, or recolour a pixel scene by theme (The Night Sky Rule).
- **Don't** add offset shadows to tables, ticket lists or dashboards (The Flat Data Rule).
- **Don't** use `Tabs` to switch what one area shows; use the segmented control.
- **Don't** bring the arcade costume into dense data inside a case; there the screen is an instrument.
- **Don't** put an eyebrow label above a heading: the heading carries its own weight. A speaker name in Kanbo's bubble is not an eyebrow.
- **Don't** mark callouts with a thick coloured border on one side; use the full 2px frame (Frame Periwinkle at 60%, or gold at 50% for the model answer).
