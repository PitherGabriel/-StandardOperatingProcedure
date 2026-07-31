# PuntodeVentaTB — project guide

Point-of-sale web app for **Comercial TB**. Deployed on AWS via Docker.

## Stack
- **Frontend:** React 19 + Vite 7, **Tailwind CSS v4** (CSS-based config — tokens live in
  `@theme` inside `frontend/src/index.css`; there is **no `tailwind.config.js`**), Headless UI,
  lucide-react icons, recharts. Feature-organized `src/components/**` + `hooks/` + `services/` +
  `api/client.js`.
- **Backend:** Python Flask (`backend/`), data in Google Sheets via gspread.
- **Hardware:** thermal receipt/label printer via a local Go bridge (`print_bridge/`), Honeywell
  HF680 barcode scanner (USB HID keyboard-wedge, matched on product `codigo`).

## Commands (run from `frontend/`)
- `npm run dev` — vite dev server on `http://localhost:5173` (bind `--host`).
- `npm run build` — production build to `dist/`.
- `npm run lint` — ESLint. Run this before finishing any frontend change.

## Conventions
- **UI copy is in Spanish.** Match existing tone (e.g. "Producto agregado", "Sin stock").
- **Do not hardcode hex colors.** Use the design tokens (`bg-brand-500`, `from-header-start`, …).
  See the `design-system` skill.
- Follow existing component patterns before inventing new ones — see the `component-conventions`
  skill.

## UX/UI workflow
This repo is set up for a visual feedback loop:
- **Playwright MCP** drives a real Chromium against the running dev server — navigate, interact,
  and screenshot to *see* changes instead of editing blind. Screenshots go to `.playwright-mcp/`.
- **Figma MCP** (`https://mcp.figma.com/mcp`) pulls design context / tokens when a Figma
  reference is provided.
- Skills: `design-system`, `component-conventions`, `ux-review-checklist`.
- Subagents: `design-reviewer` (see-and-critique, read-only), `frontend-implementer` (build +
  self-verify).
