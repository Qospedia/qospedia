# Design System Inspired by Grokipedia

## 1. Visual Theme & Atmosphere

Grokipedia embodies a clean, minimalist philosophy centered on knowledge accessibility and intellectual clarity. The design prioritizes content discovery and readability through generous whitespace, subtle depth, and a refined neutral-dominant palette punctuated by purposeful accent colors. The interface feels approachable yet authoritative—supporting both casual browsing and serious research. Typography is disciplined and hierarchical, favoring system fonts for universal clarity. The overall atmosphere is one of calm professionalism: the interface steps back so that knowledge can take center stage.

**Key Characteristics**
- Minimalist aesthetic with generous whitespace and breathing room
- Neutral-first color strategy with selective accent use
- High emphasis on content readability and hierarchy
- Subtle shadows and elevation for depth without distraction
- Rounded corners softening utilitarian forms
- System typeface ensuring universal accessibility and performance
- Dark text on light backgrounds for optimal contrast and legibility

## 2. Color Palette & Roles

### Primary
- **Pure Black** (`#050505`): Primary text, headings, and strong foreground elements; dominant throughout the interface
- **Near White** (`#FCFCFC`): Secondary backgrounds, elevated surfaces, and card interiors

### Accent Colors
- **Blue** (`#2563EB`): Secondary actions, links, and interactive states
- **Rose** (`#F43F5E`): Attention-grabbing elements and highlights
- **Purple** (`#8B5CF6`): Tertiary accent for category distinctions and supplementary actions
- **Cyan** (`#06B6D4`): Quaternary accent for specialized highlights and data visualization

### Interactive
- **Light Blue** (`#DBEAFE`): Hover states and soft interactive backgrounds
- **Lighter Blue** (`#BFDBFE`): Disabled states and muted interactive feedback
- **Light Purple** (`#E9D5FF`): Purple accent hover states and transitions

### Neutral Scale
- **Dark Gray** (`#636363`): Secondary text, descriptions, and diminished content
- **Medium Gray** (`#858585`): Tertiary text, metadata, and auxiliary information
- **Light Gray** (`#E5E7EB`): Borders, dividers, and subtle separators
- **Off-White** (`#F7F7F7`): Subtle background differentiation and section breaks
- **Cloud White** (`#F2F2F2`): Minimal background tinting for form containers

### Surface & Borders
- **Border Gray** (`#E5E7EB`): Primary border color for inputs, cards, and containers
- **Soft Border** (`rgba(5, 5, 5, 0.1)`): Subtle borders on lighter surfaces
- **Minimal Border** (`rgba(5, 5, 5, 0.06)`): Ultra-light borders for inputs and soft containers

### Semantic / Status
- **Error Red** (`#EF4444`): Error states, destructive actions, and validation failures
- **Success Green** (`#22C55E`): Confirmation states, successful operations, and positive feedback

## 3. Typography Rules

### Font Family
- **Primary**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Secondary**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (fallback to system fonts ensures universal rendering and optimal performance)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display (H1) | system-ui | 32px | 600 | 40px | -0.02em | Large masthead titles; use sparingly |
| Heading (H2) | system-ui | 20px | 600 | 28px | -0.01em | Section headers and primary content titles |
| Heading (H3) | system-ui | 16px | 600 | 24px | 0em | Subsection headers and card titles |
| Body | system-ui | 14px | 400 | 20px | 0em | Primary paragraph text and content body |
| Button | system-ui | 16px | 400 | 24px | 0em | Icon buttons and primary actions |
| Button Label | system-ui | 14px | 500 | 20px | 0em | Text-based buttons and secondary actions |
| Link | system-ui | 14px | 500 | 20px | 0em | Inline links and navigation text |
| Caption | system-ui | 12px | 400 | 16px | 0em | Metadata, timestamps, and helper text |
| Footer Link | system-ui | 12px | 400 | 16px | 0em | Footer navigation and legal links |
| Code | system-ui | 13px | 400 | 20px | 0.05em | Monospace rendering for code blocks |

### Principles
- Strict four-level hierarchy (Display, Heading, Body, Caption) ensures visual clarity and reduces cognitive load
- Weight variation (400 normal, 500 medium, 600 semibold) communicates information hierarchy without excessive typeface switching
- Line heights maintain 1.4–1.5 ratio to support readability across all sizes
- System font stack ensures cross-platform consistency and reduces network overhead
- Negative letter spacing applied only at display sizes for optical tightening; body text uses neutral spacing

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background**: `#050505`
- **Text Color**: `#FCFCFC`
- **Font Size**: `14px`
- **Font Weight**: `500`
- **Padding**: `6px 16px`
- **Border Radius**: `9999px` (full pill)
- **Border**: `0px solid transparent`
- **Height**: `32px`
- **Line Height**: `20px`
- **Hover State**: Background `#1a1a1a` (darkened), no shadow
- **Active State**: Background `#050505`, slight vertical compression

#### Secondary Button
- **Background**: `#F7F7F7`
- **Text Color**: `#050505`
- **Font Size**: `14px`
- **Font Weight**: `500`
- **Padding**: `6px 16px`
- **Border Radius**: `9999px`
- **Border**: `1px solid rgba(5, 5, 5, 0.1)`
- **Height**: `34px`
- **Line Height**: `20px`
- **Hover State**: Background `#EFEFEF`, border `rgba(5, 5, 5, 0.15)`
- **Active State**: Background `#E5E7EB`, border `rgba(5, 5, 5, 0.2)`

#### Ghost Button
- **Background**: `transparent`
- **Text Color**: `#636363`
- **Font Size**: `14px`
- **Font Weight**: `500`
- **Padding**: `6px 12px`
- **Border Radius**: `6px`
- **Border**: `0px solid transparent`
- **Height**: `auto`
- **Line Height**: `20px`
- **Hover State**: Background `rgba(5, 5, 5, 0.05)`, text color `#050505`
- **Active State**: Background `rgba(5, 5, 5, 0.1)`, text color `#050505`

#### Icon Button (Circle)
- **Background**: `transparent`
- **Text Color**: `#636363`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `6px`
- **Border Radius**: `9999px`
- **Border**: `0px solid transparent`
- **Height**: `36px`
- **Width**: `36px`
- **Line Height**: `24px`
- **Hover State**: Background `rgba(5, 5, 5, 0.05)`, text color `#050505`
- **Active State**: Background `rgba(5, 5, 5, 0.1)`

#### Dark Icon Button
- **Background**: `#050505`
- **Text Color**: `#FCFCFC`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `0px`
- **Border Radius**: `9999px`
- **Border**: `0px solid transparent`
- **Height**: `32px`
- **Width**: `32px`
- **Line Height**: `24px`
- **Hover State**: Background `#1a1a1a`
- **Active State**: Background `#050505`

### Cards & Containers

#### Standard Card
- **Background**: `#FCFCFC`
- **Border**: `1px solid #E5E7EB`
- **Border Radius**: `8px`
- **Padding**: `16px` to `24px` (context-dependent)
- **Box Shadow**: `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px` (elevation 2)
- **Text Color**: `#050505`

#### Subtle Container
- **Background**: `#F7F7F7`
- **Border**: `1px solid rgba(5, 5, 5, 0.06)`
- **Border Radius**: `8px`
- **Padding**: `12px` to `16px`
- **Box Shadow**: `none`
- **Text Color**: `#636363`

#### Minimal Section
- **Background**: `transparent`
- **Border**: `none`
- **Border Radius**: `0px`
- **Padding**: `20px` to `24px`
- **Box Shadow**: `none`
- **Text Color**: `#050505`

### Inputs & Forms

#### Search Input
- **Background**: `#F7F7F7`
- **Text Color**: `#050505`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `0px 56px 0px 40px` (space for icons)
- **Border Radius**: `24px`
- **Border**: `1px solid rgba(5, 5, 5, 0.06)`
- **Height**: `48px`
- **Line Height**: `20px`
- **Placeholder Color**: `#858585`
- **Focus State**: Border `rgba(59, 130, 246, 0.3)`, box shadow `rgba(59, 130, 246, 0.1) 0px 0px 8px`
- **Disabled State**: Background `#F2F2F2`, text color `#858585`, cursor `not-allowed`

#### Standard Input
- **Background**: `#FCFCFC`
- **Text Color**: `#050505`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `10px 12px`
- **Border Radius**: `8px`
- **Border**: `1px solid rgba(5, 5, 5, 0.06)`
- **Height**: `auto` (minimum `40px`)
- **Line Height**: `20px`
- **Placeholder Color**: `#858585`
- **Focus State**: Border `rgba(59, 130, 246, 0.3)`, outline `none`, box shadow `rgba(59, 130, 246, 0.1) 0px 0px 8px`
- **Error State**: Border `#EF4444`, text color `#EF4444`
- **Success State**: Border `#22C55E`, text color `#050505`

#### Textarea
- **Background**: `#FCFCFC`
- **Text Color**: `#050505`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `12px`
- **Border Radius**: `8px`
- **Border**: `1px solid rgba(5, 5, 5, 0.06)`
- **Min Height**: `100px`
- **Line Height**: `20px`
- **Focus State**: Border `rgba(59, 130, 246, 0.3)`, box shadow `rgba(59, 130, 246, 0.1) 0px 0px 8px`

### Navigation

#### Header Navigation
- **Background**: `#FCFCFC`
- **Text Color**: `#050505`
- **Font Size**: `14px`
- **Font Weight**: `500`
- **Padding**: `16px 24px`
- **Border Bottom**: `1px solid #E5E7EB`
- **Height**: `60px` to `70px`
- **Active Link Color**: `#2563EB`
- **Hover Link Color**: `#636363` (text darkens)
- **Active Link Underline**: `2px solid #2563EB` (bottom)

#### Footer Navigation
- **Background**: `#050505`
- **Text Color**: `#858585`
- **Font Size**: `12px`
- **Font Weight**: `400`
- **Padding**: `24px`
- **Link Color**: `#858585`
- **Link Hover**: `#FCFCFC`
- **Divider Color**: `rgba(255, 255, 255, 0.1)`

### Links

#### Inline Link
- **Color**: `#2563EB`
- **Font Size**: `14px`
- **Font Weight**: `500`
- **Text Decoration**: `none` (default), `underline` on hover
- **Cursor**: `pointer`
- **Hover Color**: `#1E40AF` (darkened blue)
- **Active Color**: `#1E3A8A` (pressed state)

#### Footer Link
- **Color**: `#858585`
- **Font Size**: `12px`
- **Font Weight**: `400`
- **Text Decoration**: `none`
- **Cursor**: `pointer`
- **Hover Color**: `#050505`

## 5. Layout Principles

### Spacing System

The design system uses an `8px` base unit with linear scaling to create harmonious, predictable spacing. All margins, padding, and gaps derive from multiples of `4px` or `8px`.

- **Micro spacing** (`4px`): Internal padding in buttons, icon-adjacent gaps, tight component spacing
- **Small spacing** (`8px`): Gaps between list items, compact section padding
- **Medium spacing** (`12px`): Card padding, form field margins
- **Standard spacing** (`16px`): Section margins, navigation padding, container gutters
- **Large spacing** (`20px`): Between major content sections, header/footer padding
- **Extra-large spacing** (`24px`): Card and container padding, significant visual separation
- **Hero spacing** (`180px`): Page-level top padding for landing sections and major breaks

### Grid & Container

- **Max Width**: `1200px` for content containers; `100%` for full-width sections
- **Column Strategy**: 12-column grid at desktop (100px columns + 16px gutters), 6-column at tablet, 1-column at mobile
- **Section Pattern**: Full-width sections with centered max-width containers; consistent left/right padding of `24px` at desktop, `16px` at tablet, `12px` at mobile
- **Gutter Width**: `16px` between columns at desktop, `12px` at tablet, `8px` on mobile
- **Container Padding**: Minimum `16px` on all sides; increases to `24px` on wider viewports

### Whitespace Philosophy

Generous whitespace is a core design principle. Content never feels crowded; breathing room around text and components improves scannability and reduces cognitive friction. Section breaks are marked by at least `20px` of vertical space; card interiors have `12px–24px` padding depending on content density. The design avoids visual clutter by limiting inline elements and favoring vertical stacking.

### Border Radius Scale

- **Sharp** (`0px`): Full-width sections, no visual separation required
- **Minimal** (`6px`): Compact buttons, small form fields, tight component variants
- **Standard** (`8px`): Cards, containers, medium-sized inputs, primary component corners
- **Large** (`24px`): Search input, hero buttons, oversized input fields
- **Full Pill** (`9999px`): Button pills, circular avatars, navigation badges

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, no offset | Backgrounds, sections, neutral elements |
| Elevated (1) | `rgba(0, 0, 0, 0.1) 0px 1px 3px` | Buttons on hover, subtle depth for interactive elements |
| Raised (2) | `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px` | Cards, modals, primary containers with clear depth separation |
| Floating (3) | `rgba(0, 0, 0, 0.3) 0px 30px 60px -15px` | Dropdowns, popovers, overlays requiring maximum visual distinction |

The shadow philosophy prioritizes clarity and restraint. Shadows are used sparingly to create focal hierarchy and distinguish interactive elements from static backgrounds. The primary shadow formula uses a large blur and negative spread to create a soft, diffused effect that doesn't feel harsh or artificial. At rest, elements are flat or carry minimal elevation; interactivity triggers shadow growth to provide tactile feedback.

## 7. Do's and Don'ts

### Do
- Use `#050505` for primary text and headings; it provides superior contrast and readability against light backgrounds
- Apply pill-shaped buttons (`9999px` radius) for primary and secondary calls-to-action; the rounded form feels approachable and modern
- Leverage the neutral palette (`#E5E7EB`, `#F7F7F7`, `#FCFCFC`) for layouts; reserve accent colors for 5–10% of interactive elements
- Maintain consistent `16px` padding in standard containers; it scales naturally across all viewport sizes
- Use system fonts exclusively; they guarantee performance, accessibility, and cross-platform consistency
- Apply `#2563EB` blue to links and interactive states; it is the primary accent with proven accessibility
- Stack elements vertically when space allows; horizontal layouts should align to the grid baseline
- Implement focus states with `rgba(59, 130, 246, 0.3)` borders and subtle shadows for keyboard navigation
- Use `#22C55E` for success states and `#EF4444` for errors; users instantly recognize these semantic meanings
- Apply shadows only to elevated cards and modals; overuse dilutes their effectiveness

### Don't
- Never use pure black (`#000000`) or pure white (`#FFFFFF`); use `#050505` and `#FCFCFC` instead for reduced eye strain
- Avoid mixing typeface families; system-ui is the single source of truth for typography
- Never apply shadows to buttons or small components; elevation should be reserved for containers and cards
- Do not exceed `24px` padding in most components; it creates excessive whitespace and reduces content density
- Avoid accent colors for body text or large text blocks; they reduce readability and feel garish at scale
- Never use borders thicker than `1px`; they add visual weight without benefit
- Do not apply focus states only on hover; keyboard users require visible focus indicators on all interactive elements
- Avoid rounded corners larger than `24px` on non-pill elements; it disrupts visual consistency
- Never use the full accent palette simultaneously; reserve purple, rose, and cyan for specific, distinct use cases
- Do not reduce line-height below `1.4` for body text; tighter spacing impairs readability

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | `320px–479px` | Single column layout, `12px` padding, `8px` gaps, touch targets `44px × 44px` minimum |
| Mobile Landscape | `480px–767px` | 2-column grid, `12px` padding, `8px` gaps, buttons stack vertically below `600px` |
| Tablet | `768px–1023px` | 6-column grid, `16px` padding, `12px` gaps, `48px` touch targets, typography scales by 10–15% |
| Desktop | `1024px–1439px` | 12-column grid, `24px` padding, `16px` gaps, `36px` touch targets, full typography hierarchy |
| Wide | `1440px+` | Max-width container `1200px` centered, consistent desktop styling, increased section padding |

### Touch Targets

- **Minimum**: `44px × 44px` for primary interactive elements (buttons, links)
- **Comfortable**: `48px × 48px` for form inputs and navigation items
- **Compact**: `36px × 36px` for icon buttons and secondary actions (desktop only)
- **Spacing**: At least `8px` margin between adjacent touch targets to prevent accidental activation

### Collapsing Strategy

- **Navigation**: Horizontal top nav collapses to hamburger menu at tablet breakpoint (`< 768px`)
- **Grid Layouts**: 12-column desktop grid reduces to 6 columns at tablet, 1 column on mobile
- **Cards**: Multi-column card grids stack to single column at mobile; spacing reduces from `16px` to `8px`
- **Padding**: Container padding scales from `24px` (desktop) → `16px` (tablet) → `12px` (mobile)
- **Typography**: Font sizes remain constant across breakpoints for consistency; line-heights never compress below `1.4`
- **Images**: Full-width at mobile (`100% - 2 × 12px`), constrained to grid columns at tablet and desktop
- **Modals**: Full-screen on mobile (`100% width, 100% height`), fixed max-width `480px` at tablet and above

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary Text**: Pure Black (`#050505`)
- **Primary CTA**: Primary Button — Black background (`#050505`) with white text (`#FCFCFC`)
- **Secondary CTA**: Secondary Button — Light gray background (`#F7F7F7`) with black text (`#050505`)
- **Background**: Near White (`#FCFCFC`) or Off-White (`#F7F7F7`)
- **Heading Text**: Pure Black (`#050505`)
- **Body Text**: Pure Black (`#050505`)
- **Secondary Text**: Dark Gray (`#636363`)
- **Tertiary Text**: Medium Gray (`#858585`)
- **Borders**: Light Gray (`#E5E7EB`)
- **Link**: Blue (`#2563EB`)
- **Link Hover**: Dark Blue (`#1E40AF`)
- **Success**: Green (`#22C55E`)
- **Error**: Red (`#EF4444`)
- **Input Background**: Off-White (`#F7F7F7`)
- **Input Border**: Soft Border (`rgba(5, 5, 5, 0.06)`)
- **Card Shadow**: `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px`

### Iteration Guide

1. **Typography Base**: All text renders in `system-ui`; no exceptions. Display uses `32px 600 weight`, headings `20px 600`, body `14px 400`, captions `12px 400`. Line heights lock to `1.4–1.5` ratio.

2. **Color Hierarchy**: `#050505` is default for headings and primary text. `#636363` for secondary labels. `#858585` for metadata and tertiary info. Use accent colors (`#2563EB`, `#F43F5E`, `#8B5CF6`, `#06B6D4`) for only 5–10% of UI surface; reserve for interactive states and semantic signals.

3. **Spacing Consistency**: Base unit is `8px`. All padding, margins, and gaps use multiples of `4px` or `8px`. Standard section padding is `16px` (mobile), `24px` (desktop). Never exceed `24px` for component internal padding unless intentional hero spacing.

4. **Component Variants**: Buttons follow the pill pattern (`9999px` radius). Primary buttons are dark (`#050505` bg, `#FCFCFC` text). Secondary buttons are light (`#F7F7F7` bg, `#050505` text). Ghost buttons are transparent with dark text. Icon buttons are square or circular depending on context.

5. **Elevation & Shadow**: Cards and modals carry shadow `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px`. Buttons and inline elements are flat (no shadow) unless in hover/active state, then apply subtle shadow `rgba(0, 0, 0, 0.1) 0px 1px 3px`. Never shadow buttons in default state.

6. **Border & Radius**: Inputs and search fields use `24px` radius (full pill). Cards use `8px` radius. Ghost buttons use `6px` radius. All borders are `1px` solid; border color is `#E5E7EB` or `rgba(5, 5, 5, 0.06)` for subtle soft borders. No borders thicker than `1px`.

7. **Interactive States**: Hover states darken or lighten by one step in the neutral palette (`#F7F7F7` → `#EFEFEF`). Focus states add `2px` outline or border in blue (`rgba(59, 130, 246, 0.3)`). Active/pressed states use the next contrast level (`#E5E7EB`). All transitions animate over `200ms` with `ease-in-out` timing.

8. **Responsive Adaptation**: Desktop max-width is `1200px`. Tablet collapses to 6-column grid with `16px` padding. Mobile uses single column with `12px` padding and `8px` gaps. Touch targets scale from `36px` (desktop icon buttons) to `44px` minimum (mobile). Typography sizes remain constant; line heights never compress.

9. **Form & Input**: Search input is `48px` tall with `0px 56px 0px 40px` padding (space for icon overlays). Standard inputs are `40px` minimum height with `10px 12px` padding. All inputs use `#FCFCFC` background with `rgba(5, 5, 5, 0.06)` borders. Focus adds blue tint border and shadow. Error state turns border red (`#EF4444`).

10. **Content & Semantic**: Link color is `#2563EB` (blue). Error text and states use `#EF4444` (red). Success feedback uses `#22C55E` (green). Disabled elements use `#858585` text on `#F2F2F2` background. Metadata and timestamps use `12px 400 weight` in `#858585`. Never use accent colors for body text at any size above `14px`.