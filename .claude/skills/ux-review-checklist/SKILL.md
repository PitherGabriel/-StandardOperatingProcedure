---
name: ux-review-checklist
description: The rubric for reviewing UX/UI quality of PuntodeVentaTB screens — visual consistency, responsive/touch behavior, accessibility, state coverage, and POS-specific safety checks. Use when reviewing a screen or flow (manually or via the design-reviewer subagent) to produce prioritized, actionable findings.
---

# UX/UI review checklist — Comercial TB POS

Review against these categories. For each issue, report: **screen/component**, **what's wrong**,
**why it matters**, **concrete fix**, and a **severity** (blocker / high / medium / polish). Rank
findings most-severe first. Verify visually with a screenshot (Playwright MCP) rather than guessing.

## 1. Visual consistency (see `design-system`)
- [ ] No raw hex literals in `className` — colors use token classes (`bg-brand-500`, etc.).
- [ ] Brand blue used for primary actions; `success`/`danger` for status, not random greens/reds.
- [ ] Consistent radii (`rounded-lg` controls, `rounded-xl` cards) and Poppins type scale.
- [ ] Consistent spacing rhythm; aligned edges; no cramped or orphaned elements.

## 2. Responsive & touch (POS is touch-first, small screens)
- [ ] Renders correctly at **~390px (mobile)** and **~768px+ (tablet)** — check both widths.
- [ ] **Touch targets ≥ ~44px** for primary actions (buttons, +/- steppers, tab bar). Cashiers
      tap fast; small targets cause mis-taps and slow checkout.
- [ ] No horizontal scroll / clipped content; long product names truncate (`truncate`) gracefully.
- [ ] Sticky/reachable primary actions (Pagar, Confirmar) without scrolling past them.

## 3. Accessibility
- [ ] Text/background contrast meets ~WCAG AA (esp. white text on brand blue, muted grays).
- [ ] Interactive elements are real `<button>`/`<input>` with visible focus (`focus:ring-2
      focus:ring-brand-500`), not click-only `<div>`s.
- [ ] Icons that convey meaning have a `title`/`aria-label` (e.g. the printer/bell buttons).
- [ ] Inputs have associated labels or clear placeholders (Spanish).

## 4. State coverage
- [ ] **Loading** uses skeletons (`ui/Skeleton.jsx`), not a blank flash or layout jump.
- [ ] **Empty** states have friendly Spanish copy, not an empty container.
- [ ] **Error** states surface via `showNotification(msg, 'error')`; failures aren't swallowed.
- [ ] Disabled/pending states on buttons during async (e.g. `disabled:bg-gray-600`).

## 5. Feedback & affordance
- [ ] Every action gives feedback (toast, state change, `active:scale-95`, spinner).
- [ ] Destructive actions (delete, devolución) are visually distinct (`danger`) and/or confirmed.
- [ ] Clear hierarchy: the primary action on a screen is the most prominent element.

## 6. POS-specific safety (do not regress)
- [ ] **Barcode scanner:** changes to `pos/PosBox.jsx` must not break the global `keydown`
      burst-detection or hijack the search / received-money inputs (`receivedRef` guard).
- [ ] **Printer/label:** don't alter `services/printerService.js` ESC/POS byte sequences during
      pure UI work.
- [ ] **Money math & stock decrement:** never change sale totals or `cantidad` updates while
      restyling — restyle markup only.
- [ ] Copy stays **Spanish** and consistent with existing terms (Pagar, Venta, Sin stock, …).

## How to run a review
1. Ensure `npm run dev` is up; open the target route via Playwright MCP.
2. Screenshot at desktop (1440) and mobile (resize to ~390) — inspect both.
3. Walk the primary flow (e.g. add to cart → Pagar) if interactive issues are in scope.
4. Score against the categories above; return prioritized findings with the exact file to edit.
