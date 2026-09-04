# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct user groups:

- **Club staff**, split by role: `administrador` (full access, including user management and linking guardians to players), `tesorero` (players, categories, payments, monthly dues, reports — no user management), and `consulta` (read-only access to the same operational modules). Staff work in a mixed field-and-desktop context: registering payments and checking player/dues status both from an office computer and from a phone or tablet at the club grounds during trainings or matches.
- **Acudientes** (parents/guardians), a separate portal-only role. They see only the players an administrator has explicitly linked to their account, and within that scope can check each child's category, document info, and monthly-dues status (paid / pending-or-partial / overdue) and outstanding balance. They cannot self-link players — only an administrator can do that.

## Product Purpose

Sistema de Gestión for **Club Deportivo Pancho Villegas**, a youth sports club. It replaces manual/ad-hoc tracking of players, categories (age/skill groups), monthly membership dues, and payments with a centralized system. It gives staff a real-time picture of collections, pending and overdue dues, and delinquent players ("morosos"), and gives guardians self-service visibility into their own children's payment status — reducing the "did we pay this month?" back-and-forth with the club office.

Success is staff being able to register a payment and see collection status accurately from anywhere (office or field), and guardians being able to check dues without contacting staff.

## Positioning

Intended direction: a product that could eventually be offered to other sports clubs, not only Pancho Villegas.

**Current state (constraint, not aspiration):** the codebase is single-tenant today — branding (club shield, name "Club Deportivo Pancho Villegas") is hardcoded, and there is no club/tenant identifier anywhere in the data model or routes. Nothing in this repo currently supports more than one club. Multi-club is a stated future direction the user wants kept in mind, not a shipped or scoped capability — treat it as an open decision, not a feature to build speculatively.

## Operating Context

- Locale is Spanish (Colombia): `es-CO` number/date formatting, currency shown as `$` with Colombian thousands separators, weekday/month names in Spanish.
- Roles gate navigation and routes: `administrador` and `adminGuard`-protected routes (e.g. `usuarios`), `tesorero`/`administrador` for payments, `staffGuard` for the internal dashboard, `acudienteGuard` for the guardian portal, and a `permisosGuard` per module (`jugadores`, `categorias`, `pagos`, `mensualidades`, `reportes`).
- Core modules: Jugadores (players), Categorías (age/skill categories), Pagos (payments), Mensualidades (monthly dues, with overdue tracking), Reportes (financial/collection reports, delinquency), Usuarios (staff account management, admin-only), Ayuda (in-app help, with separate guidance tracks for staff vs. guardians), and the Portal (`mis-hijos` / child detail) for guardians.
- Backend is a separate API (`apiUrl` in `environment.ts`, currently `http://localhost:3000/api/v1`); this repo is Angular 17 (standalone components) frontend only.
- Staff usage happens both at a desk and in the field (trainings/matches), so the interface needs to hold up on both a desktop and a phone/tablet in real usage conditions, not just responsively on paper.

## Capabilities and Constraints

- Password-expiry enforcement exists (`passwordExpiryGuard`, a change-password flow) — accounts can be forced to rotate passwords.
- Duplicate-player detection exists when registering a new player (warns on likely duplicates by name/surname).
- No client-facing marketing surface in this repo — every screen is behind auth; there is no public landing page to design for.
- Multi-club/tenant support is explicitly not built yet (see Positioning) — do not assume per-club theming, club switching, or a club data model exist.

## Brand Commitments

- Club shield/crest assets: `assets/escudo.jpg` and `assets/escudo2.png` (the dashboard welcome banner uses `escudo2.png`).
- Product name shown in the browser title and login/dashboard context: "Club Deportivo Pancho Villegas - Sistema de Gestión".
- Current type choice already wired in `index.html`: Fira Sans (body/UI) and Fira Code (presumably tabular/code-like data) via Google Fonts.
- No additional brand restrictions beyond the above were confirmed — no locked color palette, style guide, or external brand book to defer to.

## Evidence on Hand

- No user research, testimonials, benchmarks, or case studies on hand. Do not fabricate any.
- Real domain data comes from the live backend API at runtime (players, categories, payments, dues) — no static sample dataset is committed in this repo to design from.

## Product Principles

1. Staff decisions (payment status, overdue dues, delinquency) must be legible at a glance and trustworthy enough to act on immediately — this is an operational tool, not a marketing surface.
2. The same interface has to work equally well used quickly on a phone in the field and used at a desk — never design desktop-first and treat mobile as an afterthought, or vice versa.
3. Guardians get a narrower, calmer view than staff: only their own linked children, and only the information relevant to "is this paid" — do not leak staff-oriented operational detail into the guardian portal.
4. Keep the current single-club implementation honest: don't design as if multi-tenant/multi-club exists until it's actually scoped and built.
5. Spanish (Colombia) is the only language and locale to design and write copy for.

## Accessibility & Inclusion

No project-specific accessibility standard was established. No requirement beyond standard good practice was confirmed — do not invent a compliance target (e.g. WCAG level) that wasn't stated.
