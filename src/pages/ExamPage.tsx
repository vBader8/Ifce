import { useMemo, useState } from 'react';
import { QuizRunner, type QuizResult } from '../components/quiz/QuizRunner';
import { examPool, questionById, getStub } from '../content';
import { buildExam, EXAM_DISTRIBUTION, EXAM_SECONDS, EXAM_TOTAL } from '../engine/quiz';
import { newSeed } from '../engine/random';
import { useApp } from '../app/store';
import type { ExamArea } from '../content/types';
import type { ExamAttemptRecord } from '../engine/progress';
import { Bar } from '../components/ui';
import { Link } from '../app/router';

const PASS_REFERENCE = 70; // training reference only – not an official pass mark

export function areaBreakdown(records: QuizResult['records']) {
  const by: Partial<Record<ExamArea, { correct: number; total: number }>> = {};
  for (const r of records) {
    const area = questionById.get(r.qid)?.examArea;
    if (!area) continue;
    const x = by[area] ?? { correct: 0, total: 0 };
    x.total++;
    if (r.correct) x.correct++;
    by[area] = x;
  }
  return by;
}

export function ExamPage() {
  const { state, dispatch } = useApp();
  const [seed, setSeed] = useState(newSeed);
  const [running, setRunning] = useState(false);
  const plan = useMemo(() => buildExam(examPool, seed), [seed]);
  const availableByArea = useMemo(() => {
    const m: Partial<Record<ExamArea, number>> = {};
    for (const q of examPool) m[q.examArea] = (m[q.examArea] ?? 0) + 1;
    return m;
  }, []);

  if (running) {
    return (
      <div className="page-wrap">
        <QuizRunner
          key={seed}
          examMode
          title={plan.complete ? 'محاكاة امتحان IFCE (تدريبية)' : 'محاكاة جزئية (تدريبية)'}
          questions={plan.questions}
          mode="assess"
          seed={seed}
          durationSec={plan.durationSec}
          onExit={() => {
            setRunning(false);
            setSeed(newSeed());
          }}
          onFinish={(r) => {
            const rec: ExamAttemptRecord = {
              id: String(Date.now()),
              at: Date.now(),
              durationSec: plan.durationSec,
              usedSec: r.usedSec,
              total: r.total,
              correct: r.correct,
              score: r.score,
              byArea: areaBreakdown(r.records),
              answers: r.records,
              partial: !plan.complete,
            };
            dispatch({ type: 'exam', record: rec });
          }}
          renderExtra={(r) => <ExamReport records={r.records} />}
        />
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1>محاكاة الامتحان النهائي</h1>
      <div className="disclaimer" role="note">
        <strong>تنبيه:</strong> هذه محاكاة تدريبية غير رسمية بأسئلة أصلية، ولا تمثل أسئلة الامتحان الفعلي أو مستواه أو درجة النجاح الرسمية. التوزيع أدناه إرشادي كما حُدد في متطلبات المشروع.
      </div>
      <div className="exam-grid">
        <section className="card">
          <h2>المواصفات</h2>
          <ul>
            <li><bdi dir="ltr">{EXAM_TOTAL}</bdi> سؤال اختيار من متعدد · مدة <bdi dir="ltr">{EXAM_SECONDS / 3600}</bdi> ساعة · مؤقت تنازلي</li>
            <li>تنقل حر بين الأسئلة، ووضع علامة للمراجعة، وتنبيه بالأسئلة غير المجابة قبل التسليم.</li>
            <li>لا تظهر الإجابات قبل التسليم. التقرير بعد التسليم يحلل الأداء حسب المحاور.</li>
            <li>يُبنى الامتحان فقط من أسئلة الدروس المكتملة؛ لا تُكرر الأسئلة ولا يُستكمل العدد بأسئلة غير مراجعة.</li>
          </ul>
        </section>
        <section className="card">
          <h2>التوزيع الإرشادي وتوفر الأسئلة</h2>
          <table className="tbl">
            <thead>
              <tr><th>المحور</th><th>المطلوب</th><th>المتاح</th></tr>
            </thead>
            <tbody>
              {EXAM_DISTRIBUTION.map((d) => {
                const a = availableByArea[d.area] ?? 0;
                return (
                  <tr key={d.area} className={a < d.count ? 'row-warn' : ''}>
                    <td>{d.label}</td>
                    <td><bdi dir="ltr">{d.count}</bdi></td>
                    <td><bdi dir="ltr">{a}</bdi></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
      {plan.complete ? (
        <button className="btn btn-primary btn-large" onClick={() => setRunning(true)}>
          ابدأ المحاكاة الكاملة (100 سؤال / ساعتان)
        </button>
      ) : (
        <div className="card warn-card">
          <h2>المحاكاة الكاملة غير متاحة بعد</h2>
          <p>
            بنك الأسئلة المكتمل لا يغطي بعد كل المحاور المطلوبة. يمكنك أداء <strong>محاكاة جزئية</strong> من{' '}
            <bdi dir="ltr">{plan.questions.length}</bdi> سؤالًا بزمن متناسب (<bdi dir="ltr">{Math.round(plan.durationSec / 60)}</bdi> دقيقة) تغطي المحاور المتاحة فقط:
          </p>
          <ul>
            {plan.shortages.map((s) => (
              <li key={s.area}>
                {s.label}: متاح <bdi dir="ltr">{s.available}</bdi> من <bdi dir="ltr">{s.required}</bdi>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary" onClick={() => setRunning(true)} disabled={!plan.questions.length}>
            ابدأ المحاكاة الجزئية
          </button>
        </div>
      )}
      <ExamHistory exams={state.exams} />
    </div>
  );
}

export function ExamReport({ records }: { records: QuizResult['records'] }) {
  const by = areaBreakdown(records);
  const rows = EXAM_DISTRIBUTION.filter((d) => by[d.area]).map((d) => ({ ...d, ...by[d.area]!, pct: Math.round((by[d.area]!.correct / by[d.area]!.total) * 100) }));
  const strong = rows.filter((r) => r.pct >= 80);
  const weak = rows.filter((r) => r.pct < PASS_REFERENCE);
  // lessons with most wrong answers
  const wrongByLesson = new Map<string, number>();
  for (const r of records) if (!r.correct) {
    const lid = questionById.get(r.qid)?.lessonId;
    if (lid) wrongByLesson.set(lid, (wrongByLesson.get(lid) ?? 0) + 1);
  }
  const recs = [...wrongByLesson.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <section className="exam-report">
      <h2>تحليل الأداء حسب المحاور</h2>
      <ul className="area-bars">
        {rows.map((r) => (
          <li key={r.area}>
            <span>{r.label}</span>
            <Bar value={r.pct} tone={r.pct >= 80 ? 'good' : r.pct >= PASS_REFERENCE ? 'blue' : 'bad'} />
            <bdi dir="ltr">{r.correct}/{r.total} ({r.pct}%)</bdi>
          </li>
        ))}
      </ul>
      <div className="exam-grid">
        <div className="card">
          <h3>مواطن القوة</h3>
          {strong.length ? <ul>{strong.map((s) => <li key={s.area}>{s.label}</li>)}</ul> : <p className="muted">لا يوجد محور تجاوز 80% بعد.</p>}
        </div>
        <div className="card">
          <h3>مواطن الضعف</h3>
          {weak.length ? <ul>{weak.map((s) => <li key={s.area}>{s.label}</li>)}</ul> : <p className="muted">لا يوجد محور أقل من {PASS_REFERENCE}%.</p>}
        </div>
      </div>
      {recs.length > 0 && (
        <div className="card">
          <h3>توصيات المراجعة</h3>
          <ol>
            {recs.map(([lid, n]) => {
              const s = getStub(lid);
              return (
                <li key={lid}>
                  <Link to={`/book/${lid}`}>{s?.number} {s?.title}</Link> — <bdi dir="ltr">{n}</bdi> أخطاء
                </li>
              );
            })}
          </ol>
          <p className="small muted">أُضيفت أخطاؤك إلى سجل الأخطاء لمراجعتها بأسلوب جديد من صفحة «المراجعة».</p>
        </div>
      )}
      <p className="small muted">مرجع الحكم {PASS_REFERENCE}% مرجع تدريبي داخلي فقط وليس درجة نجاح رسمية.</p>
    </section>
  );
}

export function ExamHistory({ exams }: { exams: ExamAttemptRecord[] }) {
  if (!exams.length) return null;
  return (
    <section className="card">
      <h2>المحاولات السابقة</h2>
      <table className="tbl">
        <thead>
          <tr><th>التاريخ</th><th>النوع</th><th>النتيجة</th><th>الوقت المستخدم</th></tr>
        </thead>
        <tbody>
          {[...exams].reverse().map((e) => (
            <tr key={e.id}>
              <td><bdi dir="ltr">{new Date(e.at).toLocaleString('en-GB')}</bdi></td>
              <td>{e.partial ? 'جزئية' : 'كاملة'}</td>
              <td><bdi dir="ltr">{e.correct}/{e.total} ({e.score}%)</bdi></td>
              <td><bdi dir="ltr">{Math.round(e.usedSec / 60)} min</bdi></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
