import { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';
import { PRESETS, presetRange, rangeLabel } from './dateRange';

export default function DateRangePicker({ value, onChange }) {
  const [customStart, setCustomStart] = useState(value?.preset === 'custom' ? value.start : '');
  const [customEnd, setCustomEnd] = useState(value?.preset === 'custom' ? value.end : '');

  const pickPreset = (id, close) => { onChange(presetRange(id)); close(); };
  const applyCustom = (close) => {
    if (!customStart || !customEnd) return;
    const [a, b] = customStart <= customEnd ? [customStart, customEnd] : [customEnd, customStart];
    onChange({ preset: 'custom', start: a, end: b, label: rangeLabel(a, b) });
    close();
  };

  return (
    <Popover className="relative">
      <PopoverButton className="flex items-center gap-2 bg-white shadow-sm rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink hover:shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
        <CalendarBlank size={16} weight="fill" className="text-accent-600" />
        <span>{value?.label || 'Seleccionar período'}</span>
        <CaretDown size={14} className="text-gray-400" />
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
      >
        {({ close }) => (
          <>
            <div className="space-y-0.5">
              {PRESETS.map((p) => {
                const active = value?.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPreset(p.id, close)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      active
                        ? 'bg-accent-500/10 text-accent-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-100 mt-2 pt-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Personalizado
              </p>
              <div className="px-3 space-y-2">
                <label className="block text-xs text-gray-500">
                  Desde
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Hasta
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </label>
                <button
                  onClick={() => applyCustom(close)}
                  disabled={!customStart || !customEnd}
                  className="w-full py-2 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
