---
version: alpha
name: Grokipedia Minimal
description: A stark, airy, search-first knowledge interface with restrained contrast and near-zero ornament.
colors:
  primary: "#050505"
  secondary: "#666666"
  tertiary: "#9A9A9A"
  neutral: "#E5E7EB"
  surface: "#FCFCFC"
  on-surface: "#050505"
  accent: "#F7F7F7"
  error: "#B91C1C"
typography:
  headline-display:
    fontFamily: "system-ui"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "38px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "system-ui"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "29px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "system-ui"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "system-ui"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "system-ui"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0px"
  body-md:
    fontFamily: "system-ui"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "system-ui"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "system-ui"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "system-ui"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "system-ui"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0px"
  utility-xs:
    fontFamily: "system-ui"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "14px"
    letterSpacing: "0px"
  utility-sm:
    fontFamily: "system-ui"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "18px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 9999px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 40px
  lg: 56px
  xl: 194px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    height: "34px"
  button-secondary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    height: "34px"
  button-tertiary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    height: "34px"
  chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    size: "34px"
---

# Grokipedia Minimal

## Overview
Grokipedia feels extremely restrained, clean, and search-centric, with a quiet editorial tone rather than a playful product voice. The layout is intentionally spacious, almost sparse, which puts all attention on the brand mark and search entry point. It targets users who want quick access to information with minimal distraction and a strong sense of clarity.

## Colors
- **Primary (#050505):** A near-black ink used for headlines, main actions, and high-contrast text. It gives the interface a serious, authoritative feel.
- **Surface (#FCFCFC):** A soft off-white background that reads as nearly pure white without feeling harsh. It keeps the page airy and unobtrusive.
- **Neutral (#E5E7EB):** A light border and divider tone used to separate controls without adding visual weight. It supports the “barely there” aesthetic.
- **Secondary (#666666):** A mid-gray intended for secondary labels, icons, and subtle metadata. It lowers emphasis while remaining readable.
- **Tertiary (#9A9A9A):** A lighter gray for de-emphasized text and supporting details. It helps create hierarchy without introducing color.
- **Accent (#F7F7F7):** A soft fill color for low-emphasis buttons and controls. It creates gentle contrast against the surface.
- **Error (#B91C1C):** Reserved for validation and destructive feedback. It should remain rare so the palette stays monochrome and calm.

## Typography
The system uses `system-ui` as the default family, matching the native, browser-first feel of the source. Headings are bold and compact, with `headline-display` at 32px/38px for the title and progressively smaller heading levels down to 18px. Body text is straightforward and highly legible, with 16px as the main reading size and 14px/12px utility tiers for supporting UI.

Labels and controls use medium weight to improve button legibility without looking heavy. Letter spacing is neutral across the system, with no visible uppercase styling or tracking tricks. The typography should feel direct, functional, and unfussy.

## Layout
The page is built around a centered, fixed-visibility hero composition rather than a dense content grid. Large vertical spacing is a defining feature: the interface leaves generous breathing room above and below the search area, and the footer sits isolated at the bottom. Use spacing values that mirror the observed rhythm: 6px for tight internal gaps, 16px for control padding and small separations, 40px to 56px for section breathing room, and very large empty-field spacing when composing landing or search screens.

Content alignment should be centered for primary entry points and flush to the edges only for utility navigation and legal text. Controls are compact, but the overall canvas is expansive.

## Elevation & Depth
The interface is mostly flat and relies on contrast, borders, and whitespace instead of shadow-driven elevation. The only noticeable depth comes from subtle 1px borders on controls and cards, plus a very soft tonal separation between surface and accent fills. Shadows should be avoided unless a component truly needs to float; when used, they should remain minimal and unobtrusive.

## Shapes
The shape language is soft and pill-forward. Primary actions, the search field, chips, and icon buttons use `rounded.full` to produce a friendly but disciplined capsule shape. Cards use `rounded.md` for a quieter, slightly more structured container feel. Overall, the system prefers rounded utility shapes over angular corners, with `rounded.none` used only where a strict edge is necessary.

## Components
Buttons are small, compact, and highly restrained. `button-primary` and `button-secondary` are both pill-shaped controls with 34px height and 6px/16px padding; the distinction is primarily tonal, with dark emphasis for the main action and softer, lighter surfaces for secondary utility actions. Hover states should not introduce dramatic motion or shadow; keep changes to subtle color shifts, as reflected in `button-primary-hover`.

The search input is the central interactive component. It should feel like a soft capsule, with a 34px height, full rounding, light border, and internal padding that comfortably frames an icon on the left and a submit affordance on the right. The input should remain visually quiet so the hero title stays dominant.

Cards should be simple containers with `card` styling: white/off-white background, 1px neutral border, 8px radius, and 16px padding. They should support content without demanding attention.

Chips and tags should follow the same pill language as buttons, using compact padding and full rounding. Icon buttons should be circular or pill-like, with muted text/icon color and no shadow. Links should be understated, readable, and minimally styled; underlines are acceptable when the action needs clear differentiation.

## Do's and Don'ts
- Do keep the page sparse and centered, letting whitespace do most of the compositional work.
- Do use near-black text and very light surfaces to preserve the stark editorial contrast.
- Do keep buttons compact, pill-shaped, and low elevation.
- Do prefer 1px neutral borders over shadows for hierarchy.
- Don't introduce saturated accent colors or decorative gradients.
- Don't use large corner radii inconsistently; keep the capsule language coherent.
- Don't overcrowd the hero area with multiple competing calls to action.
- Don't rely on motion, blur, or heavy shadows to create depth.