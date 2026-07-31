---
name: design-system
description: The single source of truth for PuntodeVentaTB's visual design — brand colors, typography, spacing, and the Tailwind v4 token system. Use whenever writing or reviewing any frontend UI (colors, gradients, buttons, focus states) so styling stays consistent instead of drifting into ad-hoc hex literals.
---

# Design system — Comercial TB POS

Tailwind **v4** with CSS-based config. All tokens are defined in `@theme` inside
`frontend/src/index.css`. There is **no `tailwind.config.js`**. A token named `--color-brand-500`
automatically produces every color utility: `bg-brand-500`, `text-brand-500`, `border-brand-500`,
`ring-brand-500`, `from-brand-500`, `to-brand-500`, etc.

## The golden rule
**Never write raw hex in `className`** (no `bg-[#008cc8]`, `text-[#016996]`, …). Use a token class.
If a color you need isn't a token yet, add it to `@theme` first, then use the token class.

## Color tokens

| Token class base | Hex | Use for |
|---|---|---|
| `brand-400` | `#0796c2` | lighter blue, subtle accents |
| `brand-500` | `#008cc8` | **primary** — buttons, active tab, focus ring, links |
| `brand-600` | `#0176a8` | pressed/secondary blue |
| `brand-700` | `#016996` | **hover** on primary |
| `brand-800` | `#006b9e` | darkest blue |
| `header-start` | `#3982ac` | header gradient start (teal) |
| `header-end` | `#125f69` | header gradient end (teal) |
| `accent` | `#0075a7` | info toasts / accent |
| `success` | `#1d8a02` | positive POS states (paid, in stock) |
| `danger` | `#d33115` | destructive / error POS states |

Neutrals: keep using Tailwind's built-in `gray-*` scale (already used consistently — `gray-50`
backgrounds, `gray-300` borders, `gray-500/700/800` text).

## Canonical patterns
- **Primary button:** `bg-brand-500 text-white hover:bg-brand-700 rounded-lg transition`
- **Header bar:** `bg-linear-to-r from-header-start to-header-end text-white shadow-lg`
  (note Tailwind v4 uses `bg-linear-to-r`, not `bg-gradient-to-r`)
- **Active tab / selected:** `border-b-2 border-brand-500 text-brand-500`
- **Focus ring on inputs:** `focus:outline-none focus:ring-2 focus:ring-brand-500`
- **Info toast:** `bg-accent text-white` (see `NotificationToast.jsx`)

## Typography & shape
- Font: **Poppins** (`--font-sans`, loaded in `index.css`); weights 400/500/600/700.
- Radius: components use `rounded-lg` (controls) and `rounded-xl` (cards/popovers). Stay consistent.
- Responsive: mobile-first, scale up with `sm:` / `md:` (the POS is used on small touch screens).

## Migration note (incremental)
The codebase still has ~120 raw hex literals (heaviest: `#008cc8` in `StockTable.jsx`,
`InventoryForm.jsx`, `CategoriasPage.jsx`, `PosBox.jsx`). Migrate **feature-by-feature**, not all
at once: swap `bg-[#008cc8]`→`bg-brand-500`, `hover:bg-[#016996]`→`hover:bg-brand-700`,
`ring-[#008cc8]`→`ring-brand-500`, `border-[#008cc8]`→`border-brand-500`,
`text-[#008cc8]`→`text-brand-500`. Because tokens mirror the exact current hex, each swap is a
**zero visual diff** change — verify with a before/after screenshot.

Chart colors in recharts (the uppercase `#F97316`, `#F59E0B`, … arrays) are a separate categorical
palette; leave them as-is unless asked to unify them.

## When a Figma reference exists
Pull real token values with the Figma MCP `get_variable_defs`, and reconcile them into `@theme`
rather than inlining Figma's hex. `get_design_context` / `get_screenshot` give layout + visual
reference for the target.
