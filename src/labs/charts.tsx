import { fmt } from '../engine/calc';

/** Lightweight responsive SVG bar chart with an optional reference line. */
export function MiniBars({
  values,
  labels,
  reference,
  referenceLabel,
  tone = 'var(--chart-1)',
  height = 140,
  ariaLabel,
}: {
  values: number[];
  labels?: string[];
  reference?: number;
  referenceLabel?: string;
  tone?: string;
  height?: number;
  ariaLabel: string;
}) {
  const max = Math.max(1, reference ?? 0, ...values) * 1.15;
  const w = 300;
  const bw = w / Math.max(1, values.length);
  const y = (v: number) => height - 18 - (v / max) * (height - 30);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="minibars" role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      {values.map((v, i) => (
        <g key={i}>
          <rect x={i * bw + bw * 0.15} y={y(v)} width={bw * 0.7} height={Math.max(0, height - 18 - y(v))} rx={3} fill={tone} opacity={0.88} />
          {labels && (
            <text x={i * bw + bw / 2} y={height - 4} textAnchor="middle" className="minibars-label">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
      {reference !== undefined && (
        <g>
          <line x1={0} x2={w} y1={y(reference)} y2={y(reference)} className="minibars-ref" />
          <text x={4} y={y(reference) - 4} className="minibars-reflabel">
            {referenceLabel ?? fmt(reference)}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Horizontal stacked bar showing how an amount is split between parties. */
export function SplitBar({ parts, ariaLabel }: { parts: { label: string; value: number; color: string }[]; ariaLabel: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div className="splitbar" role="img" aria-label={ariaLabel}>
      <div className="splitbar-track">
        {parts.map((p) => (
          <div key={p.label} className="splitbar-seg" style={{ width: `${(Math.max(0, p.value) / total) * 100}%`, background: p.color }} title={`${p.label}: ${fmt(p.value)}`} />
        ))}
      </div>
      <ul className="splitbar-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} aria-hidden /> {p.label}: <bdi dir="ltr">{fmt(p.value)}</bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}
