import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Question } from '../../content/types';
import { grade, presentQuestions, DIFFICULTY_LABEL, type PresentedQuestion } from '../../engine/quiz';
import type { AnswerRecord, QuizMode } from '../../engine/progress';
import { Modal } from '../ui';
import { conceptLabel } from '../book/LessonPages';

export interface QuizResult {
  correct: number;
  total: number;
  score: number;
  records: AnswerRecord[];
  usedSec: number;
}

const LETTERS = ['أ', 'ب', 'ج', 'د'];

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function QuizRunner({
  title,
  questions,
  mode,
  seed,
  durationSec,
  threshold,
  onFinish,
  onExit,
  examMode = false,
  renderExtra,
}: {
  title: string;
  questions: Question[];
  mode: QuizMode;
  seed: number;
  durationSec?: number;
  threshold?: number;
  onFinish: (r: QuizResult) => void;
  onExit: () => void;
  examMode?: boolean;
  renderExtra?: (r: QuizResult) => React.ReactNode;
}) {
  const presented = useMemo<PresentedQuestion[]>(() => presentQuestions(questions, seed), [questions, seed]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [left, setLeft] = useState(durationSec ?? 0);
  const start = useRef(Date.now());
  const finished = useRef(false);

  const submit = () => {
    if (finished.current) return;
    finished.current = true;
    const g = grade(presented, answers);
    const r: QuizResult = { ...g, usedSec: Math.round((Date.now() - start.current) / 1000) };
    setResult(r);
    setConfirm(false);
    onFinish(r);
  };

  useEffect(() => {
    if (!durationSec || result) return;
    const t = window.setInterval(() => {
      const remain = Math.max(0, durationSec - Math.round((Date.now() - start.current) / 1000));
      setLeft(remain);
      if (remain <= 0) submit();
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSec, result]);

  if (!presented.length) return <p>لا توجد أسئلة.</p>;

  if (result) return <QuizResults title={title} presented={presented} answers={answers} result={result} threshold={threshold} onExit={onExit} extra={renderExtra?.(result)} />;

  const cur = presented[i];
  const q = cur.q;
  const chosen = answers[q.id] ?? null;
  const isLocked = locked.has(q.id);
  const answeredCount = presented.filter((p) => answers[p.q.id] !== undefined && answers[p.q.id] !== null).length;
  const unanswered = presented.map((p, k) => ({ p, k })).filter(({ p }) => answers[p.q.id] === undefined || answers[p.q.id] === null);

  const choose = (orig: number) => {
    if (isLocked) return;
    setAnswers((a) => ({ ...a, [q.id]: orig }));
    if (mode === 'learn') setLocked((s) => new Set(s).add(q.id));
  };

  return (
    <div className={`quiz ${examMode ? 'quiz-exam' : ''}`}>
      <header className="quiz-head">
        <div>
          <h1>{title}</h1>
          <p className="muted small">
            {mode === 'learn' ? 'وضع التعلم: يظهر التصحيح بعد كل سؤال' : 'وضع التقييم: لا تظهر الإجابات قبل التسليم'} · أُجيب{' '}
            <bdi dir="ltr">{answeredCount}/{presented.length}</bdi>
          </p>
        </div>
        {durationSec !== undefined && (
          <div className={`timer ${left < 300 ? 'low' : ''}`} role="timer" aria-live={left < 300 ? 'polite' : 'off'} aria-label="الوقت المتبقي">
            ⏱ <bdi dir="ltr">{fmtTime(left)}</bdi>
          </div>
        )}
      </header>

      <nav className="qpalette" aria-label="الانتقال بين الأسئلة">
        {presented.map((p, k) => {
          const a = answers[p.q.id];
          const lockedRes = mode === 'learn' && locked.has(p.q.id) ? (a === p.q.answer ? 'right' : 'wrong') : '';
          return (
            <button
              key={p.q.id}
              type="button"
              className={`qdot ${k === i ? 'cur' : ''} ${a !== undefined && a !== null ? 'done' : ''} ${flags.has(p.q.id) ? 'flag' : ''} ${lockedRes}`}
              onClick={() => setI(k)}
              aria-label={`السؤال ${k + 1}${flags.has(p.q.id) ? ' (معلّم للمراجعة)' : ''}`}
              aria-current={k === i}
            >
              {k + 1}
            </button>
          );
        })}
      </nav>

      <section className="qcard" aria-labelledby="qstem">
        <div className="qmeta">
          <span>
            السؤال <bdi dir="ltr">{i + 1}</bdi> من <bdi dir="ltr">{presented.length}</bdi>
          </span>
          <span className="badge badge-muted">{q.kind === 'scenario' ? 'سيناريو' : 'شامل'} · {DIFFICULTY_LABEL[q.difficulty]}</span>
          <button type="button" className={`btn btn-ghost btn-small ${flags.has(q.id) ? 'on' : ''}`} aria-pressed={flags.has(q.id)} onClick={() => setFlags((s) => { const n = new Set(s); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}>
            ⚑ {flags.has(q.id) ? 'معلّم للمراجعة' : 'علّم للمراجعة'}
          </button>
        </div>
        <p id="qstem" className="qstem">{q.stem}</p>
        <div className="opts" role="radiogroup" aria-labelledby="qstem">
          {cur.order.map((orig, pos) => {
            const sel = chosen === orig;
            const showRes = isLocked;
            return (
              <button
                key={orig}
                type="button"
                role="radio"
                aria-checked={sel}
                className={`opt ${sel ? 'sel' : ''} ${showRes && orig === q.answer ? 'right' : ''} ${showRes && sel && orig !== q.answer ? 'wrong' : ''}`}
                onClick={() => choose(orig)}
                disabled={isLocked && !sel && orig !== q.answer}
              >
                <span className="opt-letter">{LETTERS[pos]}</span>
                <span>{q.options[orig]}</span>
              </button>
            );
          })}
        </div>
        {isLocked && chosen !== null && (
          <div className={`feedback ${chosen === q.answer ? 'ok' : 'no'}`} role="status">
            <strong>{chosen === q.answer ? '✓ إجابة صحيحة' : '✗ إجابة غير صحيحة — فرصة للتعلم'}</strong>
            <p>{q.explanation}</p>
            {chosen !== q.answer && (
              <ul className="why">
                <li><b>لماذا اختيارك غير صحيح:</b> {q.optionNotes[chosen]}</li>
                <li><b>لماذا الصحيح صحيح:</b> {q.options[q.answer]} — {q.optionNotes[q.answer]}</li>
              </ul>
            )}
          </div>
        )}
      </section>

      <footer className="quiz-foot">
        <button type="button" className="btn btn-ghost" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
          → السابق
        </button>
        {i < presented.length - 1 ? (
          <button type="button" className="btn" onClick={() => setI((k) => k + 1)}>
            التالي ←
          </button>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={() => (unanswered.length || flags.size ? setConfirm(true) : submit())}>
          إنهاء وتسليم
        </button>
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          خروج
        </button>
      </footer>

      {confirm && (
        <Modal
          title="تأكيد التسليم"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirm(false)} autoFocus>
                العودة للأسئلة
              </button>
              <button className="btn btn-primary" onClick={submit}>
                تسليم الآن
              </button>
            </>
          }
        >
          {unanswered.length > 0 ? (
            <>
              <p>لديك <strong><bdi dir="ltr">{unanswered.length}</bdi></strong> سؤالًا دون إجابة وستُحتسب خاطئة:</p>
              <div className="qpalette small">
                {unanswered.map(({ k }) => (
                  <button key={k} className="qdot" onClick={() => { setI(k); setConfirm(false); }}>
                    {k + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>أجبت عن جميع الأسئلة.</p>
          )}
          {flags.size > 0 && <p>لديك <bdi dir="ltr">{flags.size}</bdi> سؤالًا معلّمًا للمراجعة.</p>}
        </Modal>
      )}
    </div>
  );
}

function QuizResults({ title, presented, answers, result, threshold, onExit, extra }: { title: string; presented: PresentedQuestion[]; answers: Record<string, number | null>; result: QuizResult; threshold?: number; onExit: () => void; extra?: React.ReactNode }) {
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong');
  const byConcept = new Map<string, { c: number; t: number }>();
  for (const r of result.records) {
    const x = byConcept.get(r.concept) ?? { c: 0, t: 0 };
    x.t++;
    if (r.correct) x.c++;
    byConcept.set(r.concept, x);
  }
  const passed = threshold !== undefined ? result.score >= threshold : undefined;
  const list = presented.filter((p) => filter === 'all' || answers[p.q.id] !== p.q.answer);
  return (
    <div className="quiz-results">
      <h1>نتيجة: {title}</h1>
      <div className={`score-card ${passed === undefined ? '' : passed ? 'good' : 'bad'}`}>
        <span className="score-num"><bdi dir="ltr">{result.score}%</bdi></span>
        <span>
          <bdi dir="ltr">{result.correct}/{result.total}</bdi> إجابة صحيحة
          {passed !== undefined && <> — {passed ? 'تحقق حد الإتقان ✓' : `أقل من حد الإتقان (${threshold}%)`}</>}
        </span>
      </div>
      {extra}
      <h2>حسب المفهوم</h2>
      <ul className="concept-break">
        {[...byConcept.entries()].map(([c, v]) => (
          <li key={c} className={v.c < v.t ? 'weak' : ''}>
            <span>{conceptLabel(c)}</span>
            <bdi dir="ltr">{v.c}/{v.t}</bdi>
          </li>
        ))}
      </ul>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={filter === 'wrong'} className={filter === 'wrong' ? 'on' : ''} onClick={() => setFilter('wrong')}>الأخطاء فقط</button>
        <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>كل الأسئلة</button>
      </div>
      {list.length === 0 && <p className="good">لا توجد أخطاء. أحسنت!</p>}
      <ol className="review-list">
        {list.map((p) => {
          const a = answers[p.q.id];
          return (
            <li key={p.q.id} className={a === p.q.answer ? 'ok' : 'no'}>
              <p className="qstem">{p.q.stem}</p>
              <ul className="review-opts">
                {p.order.map((o) => (
                  <li key={o} className={`${o === p.q.answer ? 'right' : ''} ${a === o && o !== p.q.answer ? 'wrong' : ''}`}>
                    <span>{p.q.options[o]}</span>
                    <small>{p.q.optionNotes[o]}</small>
                  </li>
                ))}
              </ul>
              {(a === undefined || a === null) && <p className="muted small">لم تُجب عن هذا السؤال.</p>}
              <p className="explain"><b>التفسير:</b> {p.q.explanation}</p>
            </li>
          );
        })}
      </ol>
      <button className="btn btn-primary" onClick={onExit}>
        العودة
      </button>
    </div>
  );
}
