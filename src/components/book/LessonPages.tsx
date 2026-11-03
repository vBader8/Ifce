import { useState } from 'react';
import type { Chapter, Lesson, Question } from '../../content/types';
import { Ltr, StatusBadge, ProgressRing, Modal } from '../ui';
import { useApp } from '../../app/store';
import { isMastered, lessonProgress, readingPercent, weakConcepts } from '../../engine/progress';
import { LESSON_SECTIONS, questionsFor, getStub } from '../../content';
import { navigate } from '../../app/router';
import { LABS } from '../../labs/registry';
import { mulberry32, shuffle } from '../../engine/random';
import { CONCEPT_LABELS } from '../../content/concepts';

export function IntroPage({ lesson, chapter, firstInChapter }: { lesson: Lesson; chapter: Chapter; firstInChapter: boolean }) {
  return (
    <div className="lesson-intro">
      {firstInChapter && (
        <div className="chapter-banner popup" style={{ ['--accent' as string]: chapter.accent }}>
          <span className="chapter-num">الفصل {chapter.number}</span>
          <strong>{chapter.title}</strong>
          <Ltr className="muted">{chapter.titleEn}</Ltr>
        </div>
      )}
      <p className="kicker">
        الدرس <Ltr>{lesson.number}</Ltr> · <Ltr className="muted">{lesson.titleEn}</Ltr>
      </p>
      <h2 className="lesson-title">{lesson.title}</h2>
      <StatusBadge status={lesson.status} />
      {lesson.reviewNotes && lesson.reviewNotes.length > 0 && (
        <div className="review-banner" role="note">
          <strong>تنبيه علمي:</strong> بعض نقاط هذا الدرس بانتظار مراجعة بشرية:
          <ul>{lesson.reviewNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      )}
      <h3>أهداف التعلم</h3>
      <ul className="objectives">
        {lesson.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <h3>تعريف المفهوم</h3>
      <p className="definition">{lesson.definition}</p>
    </div>
  );
}

export function TermsPage({ lesson }: { lesson: Lesson }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div>
      <h2 className="page-title">المصطلحات الأساسية</h2>
      <p className="muted">اضغط البطاقة لتقلبها وترى المصطلح الإنجليزي.</p>
      <div className="term-grid popstage">
        {lesson.terms.map((t, i) => (
          <button
            type="button"
            key={t.ar}
            className={`term-card popup ${flipped.has(i) ? 'flipped' : ''}`}
            style={{ animationDelay: `${i * 70}ms` }}
            aria-pressed={flipped.has(i)}
            aria-label={`${t.ar}${flipped.has(i) ? ` — ${t.en}` : ''}`}
            onClick={() => setFlipped((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
            data-nodrag
          >
            <span className="term-front">{t.ar}</span>
            <span className="term-back">
              <Ltr>{t.en}</Ltr>
              {t.note && <small>{t.note}</small>}
            </span>
          </button>
        ))}
      </div>
      <h3>مسار هذا الدرس</h3>
      <ol className="path">
        {['المفهوم والمصطلحات', 'الشرح والمختبر', 'الأمثلة والمقارنات', 'الأخطاء الشائعة والملخص', 'الاختباران والإتقان'].map((s, i) => (
          <li key={s} className="popup" style={{ animationDelay: `${200 + i * 60}ms` }}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ExplainPage({ lesson }: { lesson: Lesson }) {
  const [simple, setSimple] = useState(false);
  const [deep, setDeep] = useState(false);
  return (
    <div>
      <h2 className="page-title">الشرح</h2>
      <div className="layer-buttons" data-nodrag>
        <button type="button" className={`btn btn-small ${simple ? 'on' : 'btn-ghost'}`} aria-pressed={simple} onClick={() => setSimple((s) => !s)}>
          💡 اشرح لي ببساطة
        </button>
        <button type="button" className={`btn btn-small ${deep ? 'on' : 'btn-ghost'}`} aria-pressed={deep} onClick={() => setDeep((s) => !s)}>
          🔍 تعمّق أكثر
        </button>
      </div>
      {simple && (
        <aside className="layer layer-simple popup" aria-label="شرح مبسط">
          <h4>ببساطة</h4>
          {lesson.explanation.simple.map((p) => <p key={p}>{p}</p>)}
        </aside>
      )}
      <div className="prose">
        {lesson.explanation.core.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {deep && (
        <aside className="layer layer-deep popup" aria-label="تعمق">
          <h4>للتعمق</h4>
          {lesson.explanation.deep.map((p) => <p key={p}>{p}</p>)}
        </aside>
      )}
      <h3>المصطلحات</h3>
      <dl className="term-list">
        {lesson.terms.map((t) => (
          <div key={t.ar}>
            <dt>{t.ar}</dt>
            <dd><Ltr>{t.en}</Ltr></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LabPage({ lesson }: { lesson: Lesson }) {
  const { dispatch } = useApp();
  const entry = LABS[lesson.labId];
  if (!entry) return <p>المختبر غير متاح.</p>;
  const C = entry.Component;
  return (
    <div className="popstage">
      <C onComplete={() => dispatch({ type: 'lab', lessonId: lesson.id, labId: lesson.labId })} />
    </div>
  );
}

const LEVEL_LABEL = { simple: 'بسيط', medium: 'متوسط', advanced: 'متقدم' } as const;

export function ExamplesPage({ lesson }: { lesson: Lesson }) {
  const [tab, setTab] = useState(0);
  const [stepsShown, setStepsShown] = useState(0);
  const ex = lesson.examples[tab];
  return (
    <div>
      <h2 className="page-title">أمثلة عملية متدرجة</h2>
      <div className="tabs" role="tablist" aria-label="مستوى المثال" data-nodrag>
        {lesson.examples.map((e, i) => (
          <button key={e.title} role="tab" type="button" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => { setTab(i); setStepsShown(0); }}>
            {LEVEL_LABEL[e.level]}
          </button>
        ))}
      </div>
      <div className="example-card popup" key={tab}>
        <h3>{ex.title}</h3>
        <p>{ex.scenario}</p>
        {ex.steps && (
          <>
            <ol className="ex-steps">
              {ex.steps.slice(0, stepsShown).map((s) => (
                <li key={s} className="popup">{s}</li>
              ))}
            </ol>
            {stepsShown < ex.steps.length && (
              <button type="button" className="btn btn-small" onClick={() => setStepsShown((n) => n + 1)} data-nodrag>
                الخطوة التالية ({stepsShown + 1}/{ex.steps.length})
              </button>
            )}
          </>
        )}
        {(!ex.steps || stepsShown >= ex.steps.length) && (
          <p className="takeaway">
            <strong>الخلاصة: </strong>
            {ex.takeaway}
          </p>
        )}
      </div>
    </div>
  );
}

export function ComparePage({ lesson }: { lesson: Lesson }) {
  const [row, setRow] = useState<number | null>(null);
  if (!lesson.comparison) return <QuickCheck lesson={lesson} />;
  const c = lesson.comparison;
  return (
    <div className="popstage">
      <h2 className="page-title">مقارنة بالمفاهيم المتشابهة</h2>
      <div className="compare popup">
        <div className="scroll-x">
          <table className="tbl tbl-compare">
            <thead>
              <tr>
                <th>وجه المقارنة</th>
                {c.items.map((i) => <th key={i}>{i}</th>)}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, i) => (
                <tr key={r.aspect} className={row === i ? 'hl' : ''} onMouseEnter={() => setRow(i)} onFocus={() => setRow(i)} tabIndex={0}>
                  <th scope="row">{r.aspect}</th>
                  {r.values.map((v, k) => <td key={k}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <QuickCheck lesson={lesson} />
    </div>
  );
}

/** One quick formative question drawn from the lesson's beginner/intermediate MCQs. Not counted toward mastery. */
export function QuickCheck({ lesson }: { lesson: Lesson }) {
  const pool = questionsFor(lesson.id, 'mcq').filter((q) => q.difficulty === 'beginner' || q.difficulty === 'intermediate');
  const [seed, setSeed] = useState(() => lesson.id.length * 7 + 3);
  const [pick, setPick] = useState<number | null>(null);
  if (!pool.length) return null;
  const rand = mulberry32(seed);
  const q: Question = pool[Math.floor(rand() * pool.length)];
  const order = shuffle([0, 1, 2, 3], rand);
  return (
    <div className="quick-check popup">
      <h3>تحقق سريع من الفهم</h3>
      <p>{q.stem}</p>
      <div className="qc-opts" data-nodrag>
        {order.map((oi) => (
          <button
            key={oi}
            type="button"
            disabled={pick !== null}
            className={`opt ${pick !== null && oi === q.answer ? 'right' : ''} ${pick === oi && oi !== q.answer ? 'wrong' : ''}`}
            onClick={() => setPick(oi)}
          >
            {q.options[oi]}
          </button>
        ))}
      </div>
      {pick !== null && (
        <div role="status">
          <p className={pick === q.answer ? 'ok' : 'no'}>{pick === q.answer ? '✓ صحيح.' : `✗ ${q.optionNotes[pick]}`} {q.explanation}</p>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { setSeed((s) => s + 11); setPick(null); }} data-nodrag>
            سؤال آخر
          </button>
        </div>
      )}
      <p className="muted small">هذا التحقق تدريبي ولا يُحتسب في الإتقان.</p>
    </div>
  );
}

export function MistakesPage({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <div>
      <h2 className="page-title">الأخطاء الشائعة</h2>
      <p className="muted">اقرأ الفكرة الخاطئة، وفكّر في سبب خطئها، ثم اكشف التصحيح.</p>
      <ul className="mistakes">
        {lesson.mistakes.map((m, i) => (
          <li key={m.mistake} className="mistake">
            <p className="myth">✗ {m.mistake}</p>
            {open.has(i) ? (
              <p className="fact popup">✓ {m.correction}</p>
            ) : (
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setOpen((s) => new Set(s).add(i))} data-nodrag>
                اكشف التصحيح
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryPage({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const card = lesson.summary[i];
  const next = (k: boolean) => {
    setKnown((s) => {
      const n = new Set(s);
      if (k) n.add(i);
      else n.delete(i);
      return n;
    });
    setFlip(false);
    setI((x) => (x + 1) % lesson.summary.length);
  };
  return (
    <div className="popstage">
      <h2 className="page-title">ملخص تفاعلي</h2>
      <p className="muted">
        بطاقة <bdi dir="ltr">{i + 1}/{lesson.summary.length}</bdi> — عرفت <bdi dir="ltr">{known.size}</bdi>
      </p>
      <button type="button" className={`flashcard popup ${flip ? 'flipped' : ''}`} onClick={() => setFlip((f) => !f)} aria-label={flip ? card.back : card.front} data-nodrag>
        <span className="fc-front">{card.front}</span>
        <span className="fc-back">{card.back}</span>
      </button>
      <div className="fc-actions" data-nodrag>
        <button type="button" className="btn btn-ghost" onClick={() => next(false)}>
          أحتاج مراجعتها
        </button>
        <button type="button" className="btn" onClick={() => next(true)}>
          عرفتها ✓
        </button>
      </div>
      <h3>كل النقاط</h3>
      <ul className="summary-list">
        {lesson.summary.map((c) => (
          <li key={c.front}>
            <strong>{c.front}</strong> {c.back}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssessPage({ lesson }: { lesson: Lesson }) {
  const { state } = useApp();
  const lp = lessonProgress(state, lesson.id);
  const th = state.settings.masteryThreshold;
  const kinds = [
    { kind: 'mcq' as const, title: 'الاختبار الشامل', desc: 'يقيس المفاهيم والتعاريف والفروق والتطبيق.' },
    { kind: 'scenario' as const, title: 'اختبار السيناريوهات المتقدمة', desc: 'حالات واقعية متعددة الأطراف تقيس الاستدلال.' },
  ];
  return (
    <div>
      <h2 className="page-title">التقييم</h2>
      <p className="muted">
        حد الإتقان: <bdi dir="ltr">{th}%</bdi> في كل اختبار على حدة. وضع «التعلم» يعرض التصحيح بعد كل سؤال، ووضع «التقييم» بعد الانتهاء.
      </p>
      {kinds.map((k) => {
        const n = questionsFor(lesson.id, k.kind).length;
        const best = lp.best[k.kind];
        const tries = lp.attempts.filter((a) => a.kind === k.kind).length;
        return (
          <div key={k.kind} className="assess-card popup">
            <div>
              <h3>{k.title}</h3>
              <p>{k.desc}</p>
              <p className="small">
                <bdi dir="ltr">{n}</bdi> سؤالًا · الإتقان يتطلب <bdi dir="ltr">{Math.ceil((th / 100) * n)}</bdi> إجابة صحيحة · محاولات: <bdi dir="ltr">{tries}</bdi> · أفضل نتيجة:{' '}
                <strong className={best !== undefined && best >= th ? 'good' : ''}>{best !== undefined ? <bdi dir="ltr">{best}%</bdi> : '—'}</strong>
              </p>
            </div>
            <div className="assess-actions" data-nodrag>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => navigate(`/quiz/${lesson.id}/${k.kind}?mode=learn`)} disabled={!n}>
                وضع التعلم
              </button>
              <button type="button" className="btn btn-small" onClick={() => navigate(`/quiz/${lesson.id}/${k.kind}?mode=assess`)} disabled={!n}>
                وضع التقييم
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MasteryGatePage({ lesson, nextLessonId }: { lesson: Lesson; nextLessonId?: string }) {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState(false);
  const lp = lessonProgress(state, lesson.id);
  const th = state.settings.masteryThreshold;
  const mastered = isMastered(lp, th);
  const reading = readingPercent(lp, LESSON_SECTIONS.length);
  const weak = weakConcepts(lp);
  const next = nextLessonId ? getStub(nextLessonId) : undefined;
  const checks = [
    { ok: reading === 100, label: `قراءة جميع صفحات الدرس (${reading}%)` },
    { ok: lp.labsDone.includes(lesson.labId), label: 'إكمال المختبر (توقّع ثم اكشف)' },
    { ok: (lp.best.mcq ?? 0) >= th, label: `الاختبار الشامل ≥ ${th}%` },
    { ok: (lp.best.scenario ?? 0) >= th, label: `اختبار السيناريوهات ≥ ${th}%` },
  ];
  return (
    <div className="popstage">
      <h2 className="page-title">لوحة إتقان الدرس</h2>
      <div className="gate-rings popup">
        <ProgressRing value={reading} label="القراءة" />
        <ProgressRing value={lp.best.mcq ?? 0} label="الشامل" />
        <ProgressRing value={lp.best.scenario ?? 0} label="السيناريوهات" />
      </div>
      <div className="gate-legend"><span>القراءة</span><span>الشامل</span><span>السيناريوهات</span></div>
      <ul className="checklist">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : ''}>
            <span aria-hidden>{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
      <p className="small muted">شرط فتح الدرس التالي: اجتياز الاختبارين بحد الإتقان ثم تأكيد الانتقال. القراءة والمختبر موصى بهما بشدة.</p>
      {weak.length > 0 && (
        <div className="weak popup">
          <h4>مفاهيم تحتاج تعزيزًا</h4>
          <ul>{weak.slice(0, 5).map((w) => <li key={w.concept}>{conceptLabel(w.concept)} <small>(أخطاء: {w.wrong})</small></li>)}</ul>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => navigate(`/quiz/${lesson.id}/review`)} data-nodrag>
            مراجعة ذكية لهذه المفاهيم
          </button>
        </div>
      )}
      {mastered ? (
        next ? (
          lp.advanceConfirmed ? (
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/book/${next.id}`)} data-nodrag>
              متابعة إلى الدرس {next.number} ←
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setConfirm(true)} data-nodrag>
              ✓ أتقنت الدرس — الانتقال إلى التالي
            </button>
          )
        ) : (
          <p className="good">✓ أتقنت هذا الدرس. لا يوجد درس جاهز بعده حاليًا.</p>
        )
      ) : (
        <p className="muted">لم يتحقق شرط الإتقان بعد.</p>
      )}
      {confirm && next && (
        <Modal
          title="تأكيد الانتقال"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
                البقاء للمراجعة
              </button>
              <button
                className="btn btn-primary"
                autoFocus
                onClick={() => {
                  dispatch({ type: 'advance', lessonId: lesson.id });
                  setConfirm(false);
                  navigate(`/book/${next.id}`);
                }}
              >
                نعم، افتح الدرس {next.number}
              </button>
            </>
          }
        >
          <p>
            حققت حد الإتقان في الدرس {lesson.number}. هل تريد فتح الدرس التالي «{next.title}» والانتقال إليه؟ يمكنك العودة لهذا الدرس في أي وقت.
          </p>
        </Modal>
      )}
    </div>
  );
}

export function conceptLabel(c: string) {
  return CONCEPT_LABELS[c] ?? c.replace(/-/g, ' ');
}
