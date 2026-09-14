---
name: Precision Ledger
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#191c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353b'
  on-surface: '#e1e2ea'
  on-surface-variant: '#bacbbe'
  inverse-surface: '#e1e2ea'
  inverse-on-surface: '#2e3036'
  outline: '#849589'
  outline-variant: '#3b4a40'
  surface-tint: '#00e296'
  primary: '#76ffbb'
  on-primary: '#003822'
  primary-container: '#00e699'
  on-primary-container: '#00613e'
  inverse-primary: '#006c46'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffdedf'
  on-tertiary: '#67001b'
  tertiary-container: '#ffb7bb'
  on-tertiary-container: '#ab0033'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#4dffb1'
  primary-fixed-dim: '#00e296'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#111319'
  on-background: '#e1e2ea'
  surface-variant: '#32353b'
  income-emerald: '#10B981'
  expense-rose: '#F43F5E'
  bot-indigo: '#6366F1'
  source-whatsapp: '#25D366'
  source-telegram: '#0088CC'
  surface-slate-900: '#0C0F14'
  surface-slate-800: '#141922'
  surface-slate-700: '#1E2532'
  border-hairline: '#263040'
  text-primary: '#F8FAFC'
  text-muted: '#94A3B8'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-numeric:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  micro-badge:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system channels the refined, technical precision of high-performance developer infrastructure (evoking Neon's serverless clarity) merged with high-craft financial engineering. The personality is disciplined, modern, authoritative, and frictionless—built for operators, founders, and finance teams who demand both dense data comprehension and aesthetic elegance.

The visual direction follows a **Technical Minimalist** paradigm punctuated by precise micro-surfaces, subtle hairline borders, and targeted luminescent accents. Visual clutter is stripped down to maximize informational scanability. Data states are immediately identifiable through semantic jewel tones: vibrant emerald for income and net gains, muted coral-rose for expenses, and technical electric violet for automation and omnichannel ingest pipelines. The overall atmosphere feels engineered, responsive, and tactile—treating financial transactions with the exactitude of system telemetry.

## Colors

The color palette is architected around a deep, crystalline slate dark environment (`#0C0F14`), providing a low-strain, high-contrast canvas for dense numerical data.

- **Primary (`#00E699` / `#10B981`)**: Neon-tinted emerald, reserved for positive cashflow, income entries, successful reconciliations, active connections, and key affirmative triggers.
- **Secondary (`#6366F1`)**: Electric violet-indigo, indicating automation, bot orchestration, AI classification, and systemic background tasks.
- **Tertiary (`#F43F5E`)**: Subtle, non-alarmist coral rose, used for expense outlays, balance liabilities, and critical budget thresholds.
- **Neutral (`#0C0F14`)**: A blue-shifted near-black slate. It drives layered card surfaces (`#141922`), inner interactive wells (`#1E2532`), and subtle boundary borders (`#263040`).

### Omnichannel & Source Tags
Source verification tags use dedicated platform hues:
- **WhatsApp**: Emerald green (`#25D366`) with a 10% alpha background fill.
- **Telegram**: Sky blue (`#0088CC`) with a 10% alpha background fill.
- **Web / API**: Clean neutral slate tint (`#94A3B8`) with subtle border definition.

## Typography

Typography prioritizes tabular legibility and instant visual parsing. 

- **Plus Jakarta Sans** is employed for section headings, balance totals, and modal titles. Its clean, wide geometric curves lend a modern, polished software feel without sacrificing density.
- **Inter** powers data tables, operational metadata, body descriptions, and interactive elements.
- **Tabular Numerics**: All numeric outputs, financial tables, ledger items, and metric balances must utilize `font-feature-settings: "tnum" 1, "cv05" 1` to ensure vertical alignment of digits across variable rows.
- **Micro Badges**: Uppercase letter-spacing is applied strictly to source badges (`WEB`, `WHATSAPP`, `TELEGRAM`) and user-role tags (`ADMIN`, `VIEWER`) to guarantee clear structure at 10px and 11px rendering.

## Layout & Spacing

The layout is built upon a high-density, fluid-responsive grid system designed for data visualization and ledger management.

- **Desktop (>= 1280px)**: A 12-column fluid structure flanked by a collapsible 240px vertical navigation rail. Standard desktop gutters are fixed at `1.5rem` (`gutter-desktop`) with `2rem` screen margins (`margin-desktop`).
- **Tablet (768px - 1279px)**: 8-column layout. The rail collapses into an icon strip or drawer. Gutters scale down to `1rem`, outer margins to `1.5rem`.
- **Mobile (< 768px)**: 4-column layout with compact `1rem` outer margins. Ledger tables shift to stacked transaction cards displaying inline micro-badges.
- **Vertical Rhythm**: Financial data blocks leverage compact component spacing (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px) to maximize above-the-fold telemetry while avoiding cramped visual density.

## Elevation & Depth

This system avoids heavy drop shadows, relying instead on **Tonal Layering** paired with **Precision Hairline Outlines**:

1. **Base Floor (Canvas)**: `#0C0F14`—the deepest canvas layer supporting global layout, navigation framing, and ambient headers.
2. **Layer 1 (Card & Module Surfaces)**: `#141922` combined with a 1px solid border of `#263040`. This creates a crisp, architectural boundary without visual weight.
3. **Layer 2 (Inputs, Well Cells & Embedded Tables)**: `#1E2532` with a 1px solid border of `#263040`. Provides recessed tactile depth for form fields, data chips, and filtered ledger segments.
4. **Layer 3 (Overlays, Flyouts & Dropdowns)**: `#141922` elevated with a 1px border of `#3B485D` and an ultra-subtle ambient shadow: `0px 8px 32px rgba(0, 0, 0, 0.45)`.
5. **Interactive Glow**: Key interactive focal points (e.g., active switches, live connection dots) emit a low-spread diffuse glow: `0px 0px 12px rgba(0, 230, 153, 0.25)`.

## Shapes

The design language uses a controlled **Soft (Scale 1)** curvature model. Financial tables, ledger panels, and system tools feel grounded, sharp, and structural rather than playful:

- **Base Components (Inputs, Table Rows, Standard Buttons)**: `0.25rem` (4px).
- **Cards & Data Modules (`rounded-lg`)**: `0.5rem` (8px).
- **Dialogs & Flyout Panels (`rounded-xl`)**: `0.75rem` (12px).
- **Micro-Badges & Source Chips**: Micro pills with `9999px` radius to establish immediate contrast against the structural geometry of parent cards and tabular data.

## Components

### Buttons
- **Primary Action**: `#00E699` solid background with `#0C0F14` bold typography. Hover shifts brightness to `#10B981` with subtle border expansion.
- **Secondary Action**: Background `#1E2532`, 1px hairline border `#263040`, text `#F8FAFC`. Hover brings border to `#3B485D`.
- **Destructive/Expense Action**: 1px border `#F43F5E` at 30% alpha with soft hover background fill `#F43F5E1A`.

### Micro Badges (Sources & Roles)
- **Source Badges (`WEB`, `WHATSAPP`, `TELEGRAM`)**: 10px uppercase, font-weight 700.
  - `WHATSAPP`: Text `#25D366`, background `rgba(37, 211, 102, 0.12)`, border `rgba(37, 211, 102, 0.25)`.
  - `TELEGRAM`: Text `#38BDF8`, background `rgba(0, 136, 204, 0.12)`, border `rgba(0, 136, 204, 0.25)`.
  - `WEB`: Text `#94A3B8`, background `rgba(148, 163, 184, 0.1)`, border `rgba(148, 163, 184, 0.2)`.
- **Role Switcher (Admin vs. Viewer Preview)**:
  - Segmented compact control container (`#141922`, border `#263040`).
  - Active selection sits on `#1E2532` with a 1px border `#3B485D`. `ADMIN` tag rendered in crisp emerald or neutral, while `VIEWER` renders in subdued muted gray, dynamically toggling edit actions into read-only ledger views.

### Form Inputs & Selects
- Height: 36px (compact, high-density).
- Background `#1E2532`, border `#263040`, text `#F8FAFC`. Placeholder `#64748B`.
- Focus state: Border transitions to `#00E699` with a subtle outer ring (`box-shadow: 0 0 0 1px #00E699`).

### Financial Transaction Cards & Ledger Rows
- Tabular row layouts featuring zero padding collapse, bottom borders of `#1A222E`, alternating hover highlighting using `#141922`.
- Amount notation uses strict color alignment: Positive/Income uses `+ $XX.XX` with `#10B981`; Negative/Expense uses `- $XX.XX` with `#F43F5E`.
- Source micro-badges sit aligned adjacent to the transaction description, accompanied by relative timestamps in `#64748B`.

### Checkboxes & Radios
- Checkboxes: 16px × 16px square, radius 3px, border `#3B485D`. Checked state fills with `#00E699` and an absolute black `#0C0F14` check icon.