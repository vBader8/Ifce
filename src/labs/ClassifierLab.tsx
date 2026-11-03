import { useState } from 'react';
import { LabShell, type LabMeta, type LabProps } from './LabShell';

export interface ClassifierData {
  meta: LabMeta;
  categories: { id: string; label: string; desc: string }[];
  items: { id: string; text: string; category: string; why: string }[];
}

/** Data-driven sorting lab: the learner assigns each card to a category, then checks with explanations. */
export function makeClassifierLab(data: ClassifierData) {
  return function ClassifierLab({ onComplete }: LabProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [checked, setChecked] = useState(false);
    const allSet = data.items.every((i) => answers[i.id]);
    const score = data.items.filter((i) => answers[i.id] === i.category).length;
    return (
      <LabShell
        meta={data.meta}
        onComplete={onComplete}
        onReset={() => {
          setAnswers({});
          setChecked(false);
        }}
        controls={
          <>
            <ul className="cat-legend">
              {data.categories.map((c) => (
                <li key={c.id}>
                  <strong>{c.label}</strong>: {c.desc}
                </li>
              ))}
            </ul>
            <ol className="sort-list">
              {data.items.map((it) => {
                const ok = checked && answers[it.id] === it.category;
                const bad = checked && answers[it.id] && answers[it.id] !== it.category;
                return (
                  <li key={it.id} className={`sort-item ${ok ? 'right' : ''} ${bad ? 'wrong' : ''}`}>
                    <span className="sort-text">{it.text}</span>
                    <div className="sort-choices" role="radiogroup" aria-label={`تصنيف: ${it.text}`} data-nodrag>
                      {data.categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={answers[it.id] === c.id}
                          className={`chip ${answers[it.id] === c.id ? 'on' : ''}`}
                          disabled={checked}
                          onClick={() => setAnswers((a) => ({ ...a, [it.id]: c.id }))}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    {checked && (
                      <p className="sort-why">
                        {ok ? '✓ ' : `✗ الصحيح: ${data.categories.find((c) => c.id === it.category)?.label} — `}
                        {it.why}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        }
        results={
          <div className="classifier-result">
            {!checked ? (
              <>
                <p>صنّف جميع البطاقات ({Object.keys(answers).length}/{data.items.length}) ثم تحقق.</p>
                <button type="button" className="btn" disabled={!allSet} onClick={() => { setChecked(true); onComplete?.(); }} data-nodrag>
                  تحقق من التصنيف
                </button>
              </>
            ) : (
              <p className="verdict">
                النتيجة: <strong><bdi dir="ltr">{score}/{data.items.length}</bdi></strong>
              </p>
            )}
          </div>
        }
        interpretation={
          <p>
            {checked
              ? score === data.items.length
                ? 'تصنيف كامل. لاحظ أن المعيار في كل حالة هو التعريف لا الانطباع العام.'
                : 'راجع البطاقات المعلّمة باللون الأحمر واقرأ سبب التصنيف الصحيح، ثم أعد التجربة.'
              : 'كل بطاقة تختبر تمييزًا محددًا. اقرأ تعريف الفئات أولًا.'}
          </p>
        }
      />
    );
  };
}
