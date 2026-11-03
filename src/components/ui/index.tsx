import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { ContentStatus } from '../../content/types';
import { fmt } from '../../engine/calc';

/** Isolates English terms / formulas inside Arabic text. */
export function Ltr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`ltr ${className}`}>
      {children}
    </bdi>
  );
}

export function Money({ value, unit = 'ريال' }: { value: number; unit?: string }) {
  return (
    <span className="money">
      <Ltr>{fmt(value)}</Ltr> <small>{unit}</small>
    </span>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const map = {
    complete: ['مكتمل — تحقق داخلي', 'ok'],
    review: ['يحتاج مراجعة علمية', 'warn'],
    planned: ['قيد الإعداد', 'muted'],
  } as const;
  const [label, tone] = map[status];
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function ProgressRing({ value, size = 56, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${Math.round(v)}%`} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="ring-fg"
        strokeDasharray={c}
        strokeDashoffset={c - (c * v) / 100}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="ring-text">
        {Math.round(v)}%
      </text>
    </svg>
  );
}

export function Bar({ value, max = 100, tone = 'blue' }: { value: number; max?: number; tone?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="bar" role="presentation">
      <div className={`bar-fill tone-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  slider = true,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  slider?: boolean;
  hint?: string;
}) {
  const id = useId();
  const set = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, n)));
  };
  return (
    <div className="field" data-nodrag>
      <label htmlFor={id}>
        {label}
        {hint && <small className="hint">{hint}</small>}
      </label>
      <div className="field-row">
        {slider && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => set(e.target.value)}
            aria-label={label}
          />
        )}
        <span className="num-wrap">
          <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(e) => set(e.target.value)} dir="ltr" />
          {suffix && <small>{suffix}</small>}
        </span>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} data-nodrag>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Disclosure({ title, children, defaultOpen = false, className = '' }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`disclosure ${open ? 'open' : ''} ${className}`}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="disclosure-btn" data-nodrag>
        <span className="chev" aria-hidden>
          ‹
        </span>
        {title}
      </button>
      {open && (
        <div id={id} className="disclosure-body">
          {children}
        </div>
      )}
    </div>
  );
}

/** Traps Tab focus inside `ref`, closes on Escape, and restores focus to the opener when unmounted. */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const el = ref.current;
    if (el && !el.contains(document.activeElement)) {
      (el.querySelector<HTMLElement>('[autofocus], button, [href], input, select, textarea') ?? el).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
  }, [ref]);
}

export function Modal({ title, children, onClose, actions }: { title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions ?? <button className="btn" onClick={onClose} autoFocus>إغلاق</button>}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>
        ❖
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
