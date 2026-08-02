// Date-range helpers + presets shared by DateRangePicker and the Dashboard.
// Kept in a non-component module so the picker file only exports a component
// (required for Vite fast-refresh).

// Local-time safe formatting — never round-trips through UTC.
export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtShort = (s) => parseISO(s).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });

export const rangeLabel = (a, b) => (a === b ? fmtShort(a) : `${fmtShort(a)} – ${fmtShort(b)}`);

// Human, unambiguous date range, e.g. "2 de agosto de 2026" or
// "1 – 31 de agosto de 2026" / "1 de agosto – 15 de septiembre de 2026".
const longDate = (s, withYear = true) =>
  parseISO(s).toLocaleDateString('es-EC',
    withYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });

export function fmtRangeLong(start, end) {
  if (!start) return '';
  if (start === end) return longDate(start);
  const a = parseISO(start), b = parseISO(end);
  const sameYear = a.getFullYear() === b.getFullYear();
  if (sameYear && a.getMonth() === b.getMonth()) {
    const monthYear = a.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    return `${a.getDate()} – ${b.getDate()} de ${monthYear}`;
  }
  if (sameYear) return `${longDate(start, false)} – ${longDate(end)}`;
  return `${longDate(start)} – ${longDate(end)}`;
}

// The store's timezone — must match the backend's BUSINESS_TZ. Preset ranges are
// computed against *this* zone, not the browser's, so a browser in Europe (already
// on Aug 3) still resolves "Hoy" to Ecuador's Aug 2 — matching the backend's data.
export const BUSINESS_TZ = 'America/Guayaquil';

// "Today" in the business timezone, as a Date at local midnight, so getFullYear/
// getMonth/getDate/getDay reflect the Ecuador calendar day regardless of the browser.
export function businessToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return new Date(get('year'), get('month') - 1, get('day'));
}

// Only presets the current backend can serve (get_sales_chart + get_profit_analysis)
// plus 'custom' (handled by the picker's date inputs).
export const PRESETS = [
  { id: 'today', label: 'Hoy', calc: () => { const t = businessToday(); return [t, t]; } },
  { id: 'week', label: 'Esta semana', calc: () => { const t = businessToday(); const s = new Date(t); s.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return [s, t]; } },
  { id: 'month', label: 'Este mes', calc: () => { const t = businessToday(); return [new Date(t.getFullYear(), t.getMonth(), 1), t]; } },
];

/** Build the range object for a preset id (also used for the initial value). */
export function presetRange(id) {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
  const [start, end] = p.calc();
  return { preset: p.id, start: iso(start), end: iso(end), label: p.label };
}
