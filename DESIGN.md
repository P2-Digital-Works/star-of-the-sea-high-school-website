---
version: alpha
name: "Star of the Sea digital campus proposal"
description: "An institutional prospectus opening into a practical fictional school office."
colors:
  navy: "#102b46"
  navy-deep: "#0b2137"
  blue: "#17638c"
  blue-hover: "#104c6e"
  blue-pale: "#eaf3f8"
  gold: "#d8b777"
  gold-pale: "#fbf4e5"
  ink: "#183248"
  muted: "#526777"
  line: "#d8e2e8"
  ground: "#f3f6f8"
  white: "#fff"
  success: "#246349"
  success-pale: "#e8f3ed"
  error: "#a02c34"
typography:
  display:
    fontFamily: '"Newsreader", Georgia, serif'
    fontSize: "77px"
    fontWeight: 400
    lineHeight: 0.99
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Newsreader", Georgia, serif'
    fontSize: "46px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Source Sans 3", sans-serif'
    fontSize: "33px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Source Sans 3", sans-serif'
    fontSize: "17px"
    lineHeight: 1.55
  label:
    fontFamily: '"Source Sans 3", sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  control: "5px"
  navigation: "6px"
  inset: "7px"
  toast: "8px"
  surface: "12px"
spacing:
  control-gap: "12px"
  form-column-gap: "24px"
  panel-heading: "22px 25px"
  form-panel: "28px"
  public-section: "84px 64px"
  portal-content: "35px 36px 50px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "11px 21px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "11px 21px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "11px 21px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.surface}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  badge:
    backgroundColor: "{colors.blue-pale}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
---

# Design System: Star of the Sea digital campus proposal

## Overview

**Creative North Star: “The coastal prospectus and school office.”** The public experience uses editorial school typography, deep navy fields, restrained gold and an illustrative ocean photograph. Its broad masthead and generous reading rhythm introduce the proposed school experience. The portal shifts to quiet, practical work surfaces with compact sans serif headings and persistent fictional-data disclosure.

Public routes serve **Persuade/Read**; portal routes serve **Operate**. This is a portable, code-first static proposal by P2 Digital Works for school corporation evaluators. The palette, typography and text wordmark are provisional, not an endorsed school identity. No official logo or seal has been supplied. Content awaiting school approval stays visibly qualified.

Runtime `src/styles.css` is canonical. This document records its shipped values; it does not generate CSS. Frontmatter names map directly to the root CSS custom properties (`navy` → `--navy`, `surface` radius → `--radius`, typography family → `--display`/`--body`). Component values come from their named selectors. `.impeccable/design.json` extends this record with state snippets, motion and breakpoints. Reconcile documentation after any durable CSS change. Workflow behavior remains owned by `UX-CONTRACT.md`.

**Key Characteristics:**
- Editorial public pages; familiar operational controls.
- White work surfaces, tonal grounds and fine separators.
- English Philippines content, PHP amounts and Asia/Manila timestamps.
- Explicit demonstration status and a connected fictional dataset.

## Colors

Navy establishes institutional hierarchy; sea blue identifies actions; restrained gold marks emphasis. Frontmatter preserves the exact root CSS colors. `navy-deep` supports the proposal strip, `blue-pale` supports informational surfaces, and `gold-pale` supports disclosure. `ink`, `muted`, `line`, `ground` and `white` carry reading and working structure. `success`/`success-pale` indicate successful status; `error` accompanies written error feedback.

One light portal theme is shipped, with dark navy public panels and navigation. General focus is `3px solid #aa7326` at `4px` offset; field focus is `2px solid var(--blue)` at `2px` offset. Selection uses gold over navy. Global scrollbars use `#8ca0ae #edf2f5`, with thin width; forced-colors mode restores automatic scrollbar colors and system Highlight focus.

## Typography

Newsreader maps to `--display`: public h1/h2 and the wordmark. Source Sans 3 maps to `--body`: body, h3, controls, tables, portal h1 and panel h2. Do not apply the public serif display to operational headings. Generic h1 is `clamp(42px, 4.2vw, 64px)`, weight 500, line-height 1.1; the hero display role overrides it with `clamp(52px, 5.2vw, 77px)` and line-height .99. Public h2 uses `clamp(32px, 3.2vw, 46px)`. Frontmatter records their desktop upper dimensions (77px and 46px) for dimension-schema compatibility; these are documentation endpoints, not replacements for the canonical fluid CSS. Panel h2 is 21px/1.25, weight 600, letter-spacing 0. Body measure caps at 72ch. Tabular numerals support balances, tables and summaries.

`public/fonts.css` serves local TrueType files with `font-display: swap`: font-0 Newsreader 400, font-1 Newsreader 500; font-2 Source Sans 3 400, font-3 500, font-4 600 and font-5 700. The families fall back to Georgia/serif and sans-serif respectively. Font synthesis is disabled. Hero emphasis requests italic via `em`; no italic font face is bundled, so do not promise a separate italic asset. Body becomes 16px at 600px and below.

## Layout

Public sections cap at 1320px with 84px 64px padding. The masthead caps at 1500px; hero caps at 1600px and divides evenly between text and a 600px-high cover photograph. Quick links form three columns. Reading pages use deliberate text measures and companion information panels. The portal uses a 246px sidebar plus a min-width:0 main track; content caps at 1600px with 35px 36px 50px padding. Panels and form columns use 24px gaps. These are observed values, not a universal spacing scale.

Responsive rules are at min-width 1500px and max-width 1200px, 1000px, 800px, 600px. At 1200px the sidebar narrows to 220px; at 1000px it becomes 190px, stats become two columns, and major portal detail groups stack. At 800px the public menu becomes an explicit toggle, portal navigation becomes a horizontal scroll region, and the sidebar leaves sticky full-height layout. Some portal groups return to two columns when the sidebar disappears. At 600px hero text precedes the 240px image, public sections and forms stack, portal detail groups stack, and portal content uses 25px 18px 30px padding. Stats retain two columns.

Tables remain tables with nowrap cells and horizontal overflow inside a labeled, keyboard-focusable `.table-scroll` region. Do not hide action columns to fit a phone. Mobile cells use 17px 18px padding; headers use 12px 18px. Print removes navigation and work controls, keeps the internal summary and fictional-data watermark, releases table overflow and uses 16mm page margins.

## Elevation & Depth

Hierarchy is primarily tonal and structural: navy fields, light grounds, white panels and 1px borders. Panels have no shadow. Only feedback and modal layers lift: toast `0 6px 24px #102b4624`; dialog `0 18px 60px #102b4640`, with backdrop `#102b4677`. Do not add ambient shadows to routine data surfaces.

## Shapes

The shared surface radius is 12px. Buttons, inputs and badges use 5px; navigation 6px; inset notices and fieldsets 7px; toasts 8px. The ocean caption and compact demo tag use 3px. Avatars and numbered admissions markers are circular. Fine borders and open editorial rows carry hierarchy without turning every public section into a card.

## Components

### Buttons and navigation

Primary actions use sea blue; secondary actions use white with `#a7b9c5` borders and navy type; public emphasis uses gold. Buttons have 46px minimum height, 11px 21px padding, weight 600 and 1.25 line-height. Compact buttons use 42px minimum height and 10px 16px padding. Hover changes primary to blue-hover, secondary to blue-pale, and gold to `#e4c995`. Pressed buttons translate down 1px. Disabled buttons use opacity .55 and wait cursor. Public current links use a gold underline; portal current links use `#e7f1f7` with navy text. Icons are inline 24-unit outline SVG paths, default 20px, 1.6 stroke, rounded caps and joins; retain text labels for actions.

### Forms, feedback and overlays

Use native buttons, links, inputs, select, checkbox, date controls, details/summary and dialog. Native select popups intentionally retain OS geometry and keyboard handling. Inputs use `#aebfca` borders, 5px radius, 10px 12px padding and 44px minimum height; mobile fields become 46px. Checkbox accent is sea blue. Search uses a containing focus-within outline. Visible labels stay separate from placeholders.

Validation preserves input, shows inline written error and focuses the first invalid field. Error surfaces use `#fff1f1`; status badges retain text alongside color. Toasts use the polite live region. Native dialog supplies focus trapping, Escape and return focus for reset and unfinished-form confirmation. There is no credential form or production authentication: demo entry records acknowledgment in sessionStorage; fictional records remain browser-local. Camera access begins only after a click and stops on navigation.

### Motion and content

Button background/color transitions last .18s with ease. No decorative loading animation or skeleton is defined. Reduced-motion CSS removes transition, animation and smooth scrolling; summary preview uses instant scrolling when that preference is active. Keep monetary and date formatting through existing en-PH/PHP and Asia/Manila helpers. No chart system is shipped; numeric summaries and tables are the data vocabulary.

### Photography

`public/assets/ocean.jpg` is the sole editorial raster: sunlight over ocean waves, shown as an illustrative metaphor rather than a campus photograph. Its on-image caption explicitly says it is not a school or campus image, and its alt text describes waves. Preserve both disclosure and useful alternative text. Source: [Unsplash image CDN](https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=85&fit=crop), governed by the [Unsplash license](https://unsplash.com/license). The exact source is embedded in the JPEG COM provenance metadata and documented in `docs/ASSETS.md`; it does not establish school association. Do not infer school ownership or authorization from the image's inclusion in this proposal.

## Do's and Don'ts

- **Do** keep public expression and portal utility in their documented registers.
- **Do** preserve provisional branding and fictional-data disclosure in navigation, exports and printed summaries.
- **Do** reuse existing control, field, table and feedback helpers and native semantics.
- **Do** reconcile this record to canonical CSS after durable visual changes.
- **Don't** introduce an official school seal, endorsement, fabricated offerings or campus imagery.
- **Don't** describe demo acknowledgment as secure production authentication.
- **Don't** replace table overflow with hidden actions or remove keyboard focus states.
- **Don't** add decorative motion, card shadows or a second portal theme without a durable design decision.
