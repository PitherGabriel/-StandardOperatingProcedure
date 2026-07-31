---
name: component-conventions
description: How UI components are structured and wired in the PuntodeVentaTB React frontend — folder layout, Headless UI, icons, the modal/toast/dropdown/loading patterns, and props conventions. Use before creating or modifying any component so new work matches the existing codebase instead of introducing a parallel style.
---

# Component conventions — PuntodeVentaTB frontend

React 19 function components, one component per file, default export. No TypeScript, no CSS
modules — styling is Tailwind utility classes inline.

## Where things live (`frontend/src/`)
- `components/<feature>/` — feature folders: `pos/`, `inventory/`, `receipt/`, `camera/`,
  `layout/`, `ui/`. Put a new component in the folder that owns its feature; shared primitives go
  in `ui/`.
- `pages/` — top-level tab screens (`DashboardPage`, `HistoryPage`, `ProfitsPage`, `CategoriasPage`).
- `hooks/` — stateful logic (`useCart`, `useAuth`, `useSales`, `usePrinter`, `useNotification`).
- `services/` — API/side-effect calls; components import these, never call `fetch` inline.
- `api/client.js` — the shared `api` wrapper. All backend calls go through it.

## Libraries — reach for these, don't add new ones
- **Icons:** `lucide-react` (`import { X, User, Printer } from 'lucide-react'`), sized `size={18}`–`24`.
- **Interactive primitives:** `@headlessui/react` (menus, dialogs, transitions) when you need
  accessible behavior.
- **Charts:** `recharts`. **Barcode:** `react-barcode`. **Camera:** `react-webcam`.

## Toasts / notifications
Use the `useNotification` hook → `showNotification(message, type)` where `type` is
`'success'` | `'info'` | `'error'` (default `'success'`). Rendered by
`components/ui/NotificationToast.jsx`. Pass `showNotification` down as a prop (that's the existing
convention) — don't create a second notification mechanism. Messages are Spanish.

## Modals
Two established patterns:
1. **Self-triggering modal** (`camera/CameraModal.jsx`): the component renders its own trigger
   button when closed and a full-screen overlay when `open`. Overlay:
   `fixed inset-0 z-50 bg-black/75 backdrop-blur-sm`.
2. **Parent-controlled modal** (`receipt/PostSaleModal.jsx`): parent holds open state and renders
   the modal conditionally. Multi-step flows use a `STEPS` string-enum + a `step` state.
Both close via an `X` (lucide) button in the top corner.

## Dropdowns / popovers
Click-outside pattern from `layout/Header.jsx`: a `ref` on the container + a `mousedown` listener
on `document` that closes when the click is outside. Reuse it rather than reinventing.

## Loading / empty / error states
- **Loading:** use the skeletons in `components/ui/Skeleton.jsx` (`KpiCardSkeleton`,
  `ChartSkeleton`, `ProductRowSkeleton`, `HistoryRowSkeleton`) or compose `<Skeleton className=…/>`.
- **Empty:** centered muted text, e.g. `text-gray-400 text-sm` ("Sin notificaciones").
- Every async view should have all three states — don't leave a blank flash.

## Props & state conventions
- Data flows down as props; inventory is lifted to the top and passed as `inventory` /
  `setInventory`. After a mutating action, update local state optimistically (see
  `CameraModal.confirmAndSendCart` decrementing `cantidad`).
- Product identity is `codigo` (string). Prices are `precio` / `precio_2` / `precio_3`.
- Responsive: mobile-first; add `sm:` / `md:` for larger screens (POS runs on small touch screens).

## Styling
Follow the `design-system` skill for colors (**token classes, never raw hex**), Poppins type, and
`rounded-lg`/`rounded-xl` radii. Keep `transition` on interactive elements and `active:scale-95`
on primary touch buttons (existing tactile-feedback convention).
