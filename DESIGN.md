---
name: Club Deportivo Pancho Villegas — Sistema de Gestión
description: A navy-and-gold club identity frames an operational blue/gray interior with stoplight status color for dues and payments.
colors:
  club-navy: "#1a3a5c"
  club-navy-deep: "#0d1f33"
  club-gold: "#ffde00"
  action-blue: "#3b82f6"
  action-blue-deep: "#2563eb"
  success: "#10b981"
  success-deep: "#065f46"
  success-bg: "#d1fae5"
  warning: "#f59e0b"
  warning-deep: "#92400e"
  warning-bg: "#fef3c7"
  danger: "#ef4444"
  danger-deep: "#991b1b"
  danger-bg: "#fee2e2"
  info-deep: "#1e40af"
  info-bg: "#dbeafe"
  neutral-ink: "#111827"
  neutral-slate: "#374151"
  neutral-gray: "#6b7280"
  neutral-mist: "#9ca3af"
  neutral-border: "#e5e7eb"
  neutral-surface: "#ffffff"
  neutral-bg: "#f5f7fa"
typography:
  display:
    fontFamily: "'Fira Code', 'Courier New', monospace"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.5px"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "20px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-deep}"
  button-brand:
    backgroundColor: "{colors.club-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-deep}"
    rounded: "{rounded.lg}"
    padding: "4px 12px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-deep}"
    rounded: "{rounded.lg}"
    padding: "4px 12px"
  badge-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-deep}"
    rounded: "{rounded.lg}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# Design System: Club Deportivo Pancho Villegas — Sistema de Gestión

## Overview

**Creative North Star: "La Sala de Control del Escudo" (The Crest Control Room)**

The system has two honest layers, and the design works because it keeps them separate on purpose. The club's own colors — deep navy (#1a3a5c fading to #0d1f33) and a bright crest gold (#ffde00) — command every frame the visitor enters or leaves through: the login screen, the navbar, the sidebar, and every page header. That's the crest. Inside that frame, the actual work — rosters, dues, payments, reports — runs on a calmer, purpose-built control-room palette: neutral grays for structure, a functional blue for interactive focus, and a strict green/amber/red stoplight vocabulary for anything the staff needs to act on (paid / pending / overdue). That's the control room.

The voice is **trustworthy and composed**: warm enough to feel like a club, restrained enough to feel like a place where a family's dues are handled correctly. Brand energy — the floating particles, the pulsing crest glow, the button shine — belongs to the crest layer only (login, navbar, sidebar, page headers). The interior work screens (jugadores, pagos, mensualidades, categorías, usuarios) do not audition for that energy; they stay quiet, dense-information, and fast to scan, because the person reading them is often mid-task on a phone at the field.

The numeric register is a deliberate signature: money amounts, big stat values, receipt codes, and usernames render in monospace (Fira Code / `monospace`) against a Fira Sans interface everywhere else. It's a small, consistent tell that this is a ledger, not a brochure.

**Key Characteristics:**
- A two-layer identity: crest colors (navy/gold) own the frame, a neutral+blue control-room palette owns the work.
- Brand motion (glow, particles, shine) is reserved for login/nav/sidebar/headers — never the interior.
- A strict, reused stoplight system for status: green = pagado, amber = pendiente, red = vencido.
- Monospace for anything numeric or code-like (amounts, stat values, receipt/usernames); Fira Sans for everything else.
- Soft, low-contrast shadows and generous rounding (6–20px) throughout; no hard-edged, flat-bordered surfaces.

## Colors

The palette's content side is hand-authored to match Tailwind CSS's default blue/emerald/amber/red/gray scales exactly (no Tailwind build is present in the project — these are literal hex values copied by hand), while the brand side (navy/gold) is bespoke to the club crest.

### Primary
- **Club Navy** (`#1a3a5c`, deepening to `#0d1f33`): the crest's own color. Owns every brand surface — navbar and sidebar backgrounds (as a top-to-bottom or diagonal gradient into the deep variant), the login screen background, page-header backgrounds, and the large numeric value on dashboard stat cards.

### Secondary
- **Crest Gold** (`#ffde00`): the club's accent, used sparingly and always against navy — active sidebar item text/indicator, login-card border glow, "brand-name" text in the navbar, role-badge text, and the animated glow around the crest image. Never used as a large fill; it's a light, not a surface.
- **Action Blue** (`#3b82f6`, deepening to `#2563eb`): the functional accent for everything inside the work screens — primary buttons, active tabs, focus rings (`0 0 0 3px rgba(59,130,246,0.1)`), and selected/active states in jugadores, pagos, mensualidades, and categorías.

### Neutral
- **Ink** (`#111827`): primary body and heading text on light surfaces.
- **Slate** (`#374151`): secondary emphasis text (form labels, section labels).
- **Gray** (`#6b7280`): muted/supporting text (subtitles, table meta, timestamps).
- **Mist** (`#9ca3af`): placeholder and least-emphasis text.
- **Border** (`#e5e7eb`, with `#d1d5db` as the slightly stronger form-field variant): dividers, card borders, table rules.
- **Surface** (`#ffffff`): cards, tables, inputs, the login card.
- **Background** (`#f5f7fa`, sometimes softened to a `#f0f4f8 → #e2e8f0` diagonal gradient on the dashboard): the page canvas behind cards.

### Status (stoplight)
- **Success / Pagado** (`#10b981` on `#d1fae5`, deep text `#065f46`): a dues period fully paid; positive amounts; success toasts.
- **Warning / Pendiente** (`#f59e0b` on `#fef3c7`/`#fffbeb`, deep text `#92400e`/`#78350f`): unpaid or partially-paid dues; the duplicate-player warning card.
- **Danger / Vencido** (`#ef4444` on `#fee2e2`/`#fef2f2`, deep text `#991b1b`): overdue dues; destructive actions; error alerts.
- **Info / Parcial** (`#dbeafe` bg, deep text `#1e40af`): the one state that deliberately breaks the amber pattern — a partially-paid `mensualidad` reads as informational blue, not warning amber, because it's a normal midpoint, not a problem yet.

### Named Rules
**The Crest-Only Motion Rule.** Particles, pulsing glow, button shine, and hover-lift belong to brand surfaces only (login, navbar, sidebar, page headers). A work screen (jugadores, pagos, mensualidades, reportes, usuarios, categorías) never adopts them — it stays calm so the person scanning it on a phone at practice can act fast.

**The Stoplight Consistency Rule.** Green/amber/red always mean pagado/pendiente/vencido, system-wide, using the exact bg+deep-text pairs above. Don't invent a fourth status color or repurpose the stoplight hues for anything unrelated to payment/dues state.

## Typography

**Body Font:** Fira Sans (with -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif fallback)
**Numeric/Mono Font:** Fira Code (with 'Courier New', monospace fallback) — reserved for numbers and codes, never body prose

**Character:** Fira Sans carries a clean, humanist, slightly technical voice appropriate to an operations tool; Fira Code's appearance anywhere signals "this is a precise, ledger-grade value" — a stat total, a payment amount, a receipt code, a username.

### Hierarchy
- **Display** (700, 32px, line-height 1.1, Fira Code): the large number on a dashboard stat card (jugadores activos, recaudado, pendientes, vencidas) — the single most important figure on a card.
- **Headline** (700, 24px, line-height 1.3, Fira Sans): page-header titles and the dashboard welcome banner `h1`; white text on the navy header background.
- **Title** (600, 18px, line-height 1.3, Fira Sans): card headers inside content ("Resumen del Mes", "Acciones Rápidas", table section headers).
- **Body** (400, 14px, line-height 1.5, Fira Sans): default UI text, table cells, form values.
- **Label** (600, 12px, letter-spacing 0.5px, Fira Sans, usually uppercase): stat-card eyebrow labels, badge text, form field labels, sidebar section names — uppercase tracking is used consistently for these small structural labels, never for body copy.

### Named Rules
**The Ledger Font Rule.** Any rendered number that represents money, a count, or an identifier code (receipt numbers, usernames) is set in Fira Code. Everything else — labels, prose, button text — is Fira Sans. Mixing them the other way (Fira Code for prose, Fira Sans for a stat total) breaks the system's one legible signature.

## Layout

The shell is a fixed-height flex column (`navbar` on top, then a flex row of `sidebar` + scrollable `content`). The sidebar is 260px expanded / 64px icon-only collapsed on desktop (≥769px), and becomes a fixed, overlay-backed slide-in drawer below 768px (the project's single documented breakpoint, `BREAKPOINTS.MOBILE = 768` in `app.constants.ts`).

Content density is comfortable, not dense: cards and sections sit on 16–28px padding, `stats-grid` and similar card grids use `repeat(auto-fit, minmax(...,1fr))` so they reflow from 3–4 columns down to 1 column without a hard breakpoint list. Below 480px, data tables switch from a `<table>` layout to a stacked "card view" (`.card-table`) where each row becomes a bordered card and `data-label` attributes supply the field name — this is the system's dedicated small-screen table pattern, not a generic responsive table.

Spacing follows a loose 8/12/16/20/24/28/32px rhythm rather than a strict token scale; treat the `spacing` frontmatter values as the closest reusable steps, not a hard law.

## Elevation & Depth

Flat surfaces with soft, low-opacity ambient shadows — never hard borders as the primary separation device, though a thin `#e5e7eb`/`#d1d5db` border sometimes reinforces a card or input at rest. Brand surfaces (login card, page headers, sidebar) carry heavier, sometimes tinted shadows (`rgba(26,58,92,0.25)`, or glow-tinted `rgba(255,222,0,0.2–0.4)` around the crest); interior cards carry lighter neutral shadows (`0 2px 4px rgba(0,0,0,0.1)` to `0 4px 15px rgba(0,0,0,0.08)`). Interactive elevation is a response to state: stat cards and buttons lift on hover (`translateY(-2px to -4px)` with a deepened shadow), never at rest.

### Shadow Vocabulary
- **Ambient card** (`box-shadow: 0 2px 4px rgba(0,0,0,0.1)`): default resting elevation for cards, tables, stat cards.
- **Lifted card** (`box-shadow: 0 4px 15px rgba(0,0,0,0.08)` → `0 8px 25px rgba(0,0,0,0.12)` on hover): dashboard stat cards.
- **Brand glow** (`box-shadow: 0 8px 30px rgba(26,58,92,0.25)` or `0 10px 40px rgba(26,58,92,0.3)`, sometimes layered with `0 0 20–40px rgba(255,222,0,0.2–0.4)`): page headers, welcome banner, login card, crest image.

### Named Rules
**The Hover-Lift Rule.** Elevation increases only on interaction (hover/focus), never as a static decoration. A flat card that never changes shadow on hover is a signal something is non-interactive.

## Shapes

Corners are consistently rounded and scale with the size of the surface: 6px for buttons/small inputs, 8px for standard cards and tables, 12px for badges and brand buttons, 16px for stat cards and page-level containers, up to 20–24px for the login card and pill-shaped tokens (the navbar's `system-title` capsule, the dashboard's `welcome-date` pill). No sharp (0px) corners appear anywhere in the shipped UI, and no clipped/angled (non-rectangular) shapes are used outside the intentionally circular crest-glow decorations.

## Components

### Buttons
- **Shape:** 6px radius standard (`.btn`), up to 12px on brand-context buttons (`.btn-login`).
- **Primary (interior):** `#3b82f6` background, white text, `10px 20px` padding, `500` weight — this is the current canonical primary button; hover deepens to `#2563eb`.
- **Primary (brand context, e.g. login):** navy gradient (`#1a3a5c → #2d4a6a`) background, white text, uppercase label with 1px letter-spacing, hover adds a yellow-tinted glow shadow and a diagonal light "shine" sweep.
- **Success / Danger variants:** `#10b981` / `#ef4444` solid fills, same shape language as primary.
- **Disabled:** `opacity: 0.5–0.7`, `cursor: not-allowed`, no hover response.
- **Small (`.btn-sm`):** `6px 12px` padding, `13px` text — used for inline row actions in tables.

### Badges / Estado Pills
- **Shape:** 12px radius, `4px 12px` padding, `12px` / `600` weight text.
- **Palette:** always one of the four stoplight bg+deep-text pairs (success/warning/danger/info) — see Colors → Status. Role badges (e.g. `.badge`, user role tags) use a lighter `12px`-radius pill with `#dbeafe` bg / `#1e40af` text and `capitalize` casing instead of uppercase.

### Cards / Containers
- **Corner Style:** 8px for standard `.card`, 16px for stat cards and page-level cards (`resumen-card`, `actions-card`).
- **Background:** white (`#ffffff`) on the `#f5f7fa` page canvas.
- **Shadow Strategy:** ambient at rest, lifted on hover for anything clickable (see Elevation & Depth).
- **Border:** none by default; a 4px colored `border-left` is used specifically to tag a stat card's category (blue/green/amber/red per metric) or to accent a warning card (amber-left-border on the duplicate-player warning).
- **Internal Padding:** 16–28px depending on card size; 24px is the most common.

### Inputs / Fields
- **Style:** white background (form fields on the general canvas) or `#f8fafc` (login form fields specifically), `1–2px` solid border in `#d1d5db`/`#e2e8f0`, 6px radius standard / 12px on the login form.
- **Focus:** interior forms get a blue ring (`border-color: #3b82f6` + `box-shadow: 0 0 0 3px rgba(59,130,246,0.1)`); the login form instead glows gold (`border-color` and ring tinted `rgba(255,222,0,0.2)`), consistent with the crest-only-brand-energy rule.
- **Disabled:** not distinctly styled beyond the shared `.btn:disabled` pattern; treat as an open gap rather than a documented state.

### Navigation
- **Navbar:** navy-to-dark-navy gradient bar, gold wordmark, white user info, a translucent white "system title" capsule centered absolutely; collapses to icon-only actions below 768px.
- **Sidebar:** navy gradient, gold active-item indicator (a 3px left bar plus 15% gold background tint on `.active`), icon+label rows that collapse to icon-only (with a floating tooltip) at ≥769px when toggled, and become a slide-in drawer with a scrim below 768px.
- **Page Header:** every feature page opens with a shared navy-gradient header component (icon + title + subtitle), the one piece of brand chrome that appears inside the "interior" screens — intentional, since it's wayfinding, not a work surface.

## Do's and Don'ts

### Do:
- **Do** keep crest colors (navy/gold) confined to navbar, sidebar, login, and page headers; keep interior work surfaces on the neutral/blue/stoplight palette.
- **Do** use the exact stoplight pairs (`success`/`warning`/`danger`/`info` bg+deep-text) for any payment/dues status; don't introduce a new status color.
- **Do** set money amounts, stat totals, and code-like identifiers (receipts, usernames) in Fira Code; everything else in Fira Sans.
- **Do** use `#3b82f6` (`action-blue`) as the primary interior accent for buttons, active tabs, and focus rings.
- **Do** reserve motion (glow, particle, shine, pulse) for brand surfaces; interior cards only animate on hover/focus state changes (lift + shadow deepen), never idle.
- **Do** use the amber left-border-card treatment (`#fffbeb` bg, `#fcd34d` border, `#f59e0b` left accent) for inline advisory warnings like the duplicate-player check — it's the established "heads up, not blocking" pattern.
- **Do** switch dense tables to the `.card-table` stacked pattern below 480px rather than shrinking table cells further.

### Don't:
- **Don't** use indigo `#4f46e5` for new work. It was the original root token in `styles.css` and had drifted across several pages (`categorias`, `reportes`, `change-password`, the `.data-table` header/hover in `mensualidades`/`pagos`/`jugadores`, two Chart.js dataset colors, and the global `:focus-visible` ring) — all migrated to `#3b82f6` (`action-blue`) as of this pass. Treat any indigo you find as regression, not precedent.
- **Don't** give interior work screens (jugadores, pagos, mensualidades, reportes, usuarios) the login page's particle/glow/shine treatment — that energy is a brand-moment signature, not a system-wide default.
- **Don't** use amber for a "partial payment" state — that's specifically the info-blue pair (`#dbeafe`/`#1e40af`); amber means pendiente (nothing paid yet).
- **Don't** introduce hard (0px) corners or unrounded flat cards; every surface in the shipped system is rounded 6px or more.
- **Don't** style the guardian portal (`acudiente`) screens with denser, more operational chrome than staff screens need — per `PRODUCT.md`, guardians get a narrower, calmer view; don't let interior work-screen density bleed into the portal.
