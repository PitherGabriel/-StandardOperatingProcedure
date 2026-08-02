import { useRef, useState, useLayoutEffect } from 'react';

/**
 * FolderCard — a card whose top edge has a "folder tab": the left portion sits
 * at full height, then a smooth concave curve steps the top edge down to the
 * right. All four corners are rounded.
 *
 * The silhouette is drawn with `clip-path: path()` computed from the card's
 * measured size (via ResizeObserver), so the tab height and corner radii stay
 * constant while the card resizes — no distortion. A drop-shadow on the wrapper
 * follows the clipped shape.
 *
 * Props:
 *  - className      → layout classes for the outer wrapper (sizing, flex/grid child)
 *  - innerClassName → extra classes for the white surface (padding, flex, etc.)
 *  - side           → which side the tab sits on at ≥lg ('left' | 'right')
 *  - mobileSide     → which side the tab sits on below lg (defaults to `side`)
 *  - tabRatio       → length of the raised tab as a fraction of card width (0–1)
 *  - tabHeight      → height of the step, in px
 *  - curve          → horizontal run of the concave slope, in px (bigger = more gradual)
 *  - radius         → corner radius, in px
 *  - shadow         → CSS box for the drop-shadow filter
 */
const LG = '(min-width: 1024px)';

export default function FolderCard({
  children,
  className = '',
  innerClassName = '',
  side = 'left',
  mobileSide,
  tabRatio = 0.4,
  tabHeight = 30,
  curve = 54,
  radius = 22,
  shadow = '0 10px 30px rgba(17,24,39,0.06)',
}) {
  const ref = useRef(null);
  const [clip, setClip] = useState('');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mql = window.matchMedia(LG);

    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const effSide = mql.matches ? side : (mobileSide ?? side);
      const right = effSide === 'right';
      const X = (x) => (right ? w - x : x); // mirror horizontally for a right-side tab

      const r = Math.min(radius, w / 2, h / 2);
      const th = Math.min(tabHeight, h / 2);
      const tabW = Math.max(r + 20, Math.min(w - r - 60, w * tabRatio));
      const c = curve; // horizontal run of the concave slope

      const d = [
        `M ${X(r)} 0`,
        `L ${X(tabW)} 0`,
        `C ${X(tabW + c * 0.45)} 0 ${X(tabW + c * 0.55)} ${th} ${X(tabW + c)} ${th}`,
        `L ${X(w - r)} ${th}`,
        `Q ${X(w)} ${th} ${X(w)} ${th + r}`,
        `L ${X(w)} ${h - r}`,
        `Q ${X(w)} ${h} ${X(w - r)} ${h}`,
        `L ${X(r)} ${h}`,
        `Q ${X(0)} ${h} ${X(0)} ${h - r}`,
        `L ${X(0)} ${r}`,
        `Q ${X(0)} 0 ${X(r)} 0`,
        'Z',
      ].join(' ');
      setClip(`path('${d}')`);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    mql.addEventListener('change', compute);
    return () => { ro.disconnect(); mql.removeEventListener('change', compute); };
  }, [side, mobileSide, tabRatio, tabHeight, curve, radius]);

  return (
    <div className={`relative ${className}`} style={{ filter: `drop-shadow(${shadow})` }}>
      <div
        ref={ref}
        className={`h-full w-full bg-white flex flex-col overflow-hidden ${innerClassName}`}
        style={{ clipPath: clip || undefined }}
      >
        {children}
      </div>
    </div>
  );
}
