import { useState, type ReactNode } from 'react';
import { Disclosure } from '../components/ui';

export interface LabMeta {
  id: string;
  title: string;
  chapterId: string;
  objective: string;
  variables: { name: string; desc: string }[];
  predict: { question: string; options: string[]; answer: number; reveal: string };
  mistake: { mistake: string; correction: string };
  /** Rules used in calculations – always shown so the learner knows the example's assumptions. */
  rules?: string[];
}

export interface LabProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function LabShell({
  meta,
  onReset,
  onComplete,
  controls,
  results,
  interpretation,
}: {
  meta: LabMeta;
  onReset: () => void;
  onComplete?: () => void;
  controls: ReactNode;
  results: ReactNode;
  interpretation: ReactNode;
}) {
  const [pick, setPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const reset = () => {
    setPick(null);
    setRevealed(false);
    onReset();
  };
  return (
    <section className="lab" aria-label={meta.title} data-lab={meta.id}>
      <header className="lab-head popup">
        <span className="lab-kicker">مختبر تفاعلي</span>
        <h3>{meta.title}</h3>
        <p className="lab-objective">
          <strong>الهدف التعليمي: </strong>
          {meta.objective}
        </p>
      </header>

      <div className="predict popup" style={{ animationDelay: '80ms' }}>
        <div className="predict-q">
          <span className="tag">توقّع ثم اكشف</span> {meta.predict.question}
        </div>
        <div className="predict-opts" role="radiogroup" aria-label="توقعك" data-nodrag>
          {meta.predict.options.map((o, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={pick === i}
              disabled={revealed}
              className={`chip ${pick === i ? 'on' : ''} ${revealed && i === meta.predict.answer ? 'right' : ''} ${revealed && pick === i && i !== meta.predict.answer ? 'wrong' : ''}`}
              onClick={() => setPick(i)}
            >
              {o}
            </button>
          ))}
        </div>
        {!revealed ? (
          <button
            type="button"
            className="btn btn-small"
            disabled={pick === null}
            onClick={() => {
              setRevealed(true);
              onComplete?.();
            }}
            data-nodrag
          >
            اكشف الإجابة
          </button>
        ) : (
          <p className={`reveal ${pick === meta.predict.answer ? 'ok' : 'no'}`} role="status">
            {pick === meta.predict.answer ? '✓ توقع صحيح. ' : '✗ ليس تمامًا. '}
            {meta.predict.reveal} جرّب أدوات التحكم أدناه للتحقق بنفسك.
          </p>
        )}
      </div>

      <Disclosure title="تعريف المتغيرات" className="popup">
        <dl className="vars">
          {meta.variables.map((v) => (
            <div key={v.name}>
              <dt>{v.name}</dt>
              <dd>{v.desc}</dd>
            </div>
          ))}
        </dl>
        {meta.rules && (
          <>
            <h4>قواعد هذا المثال</h4>
            <ul className="rules">
              {meta.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </Disclosure>

      <div className="lab-grid">
        <div className="lab-controls popup" style={{ animationDelay: '140ms' }}>
          {controls}
        </div>
        <div className="lab-results popup" style={{ animationDelay: '200ms' }} aria-live="polite">
          {results}
        </div>
      </div>

      <div className="lab-interpret popup" style={{ animationDelay: '260ms' }}>
        <h4>تفسير النتائج</h4>
        {interpretation}
      </div>

      <div className="mistake-card popup" style={{ animationDelay: '300ms' }}>
        <div>
          <span className="tag tag-bad">خطأ شائع</span> {meta.mistake.mistake}
        </div>
        <div>
          <span className="tag tag-good">التصحيح</span> {meta.mistake.correction}
        </div>
      </div>

      <div className="lab-foot">
        <button type="button" className="btn btn-ghost" onClick={reset} data-nodrag>
          ↺ إعادة التجربة
        </button>
      </div>
    </section>
  );
}
