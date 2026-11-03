import { useMemo, useRef, useState } from 'react';
import { chapters, readyLessonOrder, questionsFor, getLesson, getStub, LESSON_SECTIONS, ALL_QUESTIONS, studyableLessons, questionById } from '../content';
import { useApp } from '../app/store';
import { Link, navigate } from '../app/router';
import { exportState, importState, isMastered, lessonProgress, readingPercent, unlockedLessons, weakConcepts } from '../engine/progress';
import { ProgressRing, StatusBadge, Bar, EmptyState, Segmented, Modal, NumberField } from '../components/ui';
import { LABS } from '../labs/registry';
import { REVIEW_LOG } from '../content/reviewLog';
import { conceptLabel } from '../components/book/LessonPages';

/* ============================================================ Home */
export function HomePage() {
  const { state } = useApp();
  const th = state.settings.masteryThreshold;
  const mastered = readyLessonOrder.filter((id) => isMastered(lessonProgress(state, id), th)).length;
  const last = state.lastLocation ? getStub(state.lastLocation.lessonId) : undefined;
  const totalLessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="kicker">IFCE Living Book</p>
          <h1>أكاديمية أساسيات التأمين التفاعلية</h1>
          <p>كتاب حي ثلاثي الأبعاد: اقلب الصفحات، جرّب المختبرات، واختبر فهمك حتى الإتقان. محتوى عربي أصلي مبني على هيكل منهج أساسيات التأمين.</p>
          <div className="hero-actions">
            <Link to={last ? `/book/${last.id}` : `/book/${readyLessonOrder[0]}`} className="btn btn-primary btn-large">
              {last ? `تابع: ${last.number} ${last.title}` : 'افتح الكتاب'}
            </Link>
            <Link to="/library" className="btn btn-large btn-ghost">مكتبة الفصول</Link>
          </div>
        </div>
        <div className="hero-book" aria-hidden>
          <div className="mini-book">
            <div className="mini-cover">
              <span>IFCE</span>
              <small>الكتاب الحي</small>
            </div>
            <div className="mini-pages" />
          </div>
        </div>
      </section>
      <section className="stats-row">
        <div className="stat"><strong><bdi dir="ltr">{mastered}/{readyLessonOrder.length}</bdi></strong><span>دروس متقنة من الجاهزة</span></div>
        <div className="stat"><strong><bdi dir="ltr">{readyLessonOrder.length}/{totalLessons}</bdi></strong><span>دروس جاهزة من الهيكل الكامل</span></div>
        <div className="stat"><strong><bdi dir="ltr">{ALL_QUESTIONS.length}</bdi></strong><span>سؤالًا أصليًا</span></div>
        <div className="stat"><strong><bdi dir="ltr">{Object.keys(LABS).length}</bdi></strong><span>مختبرًا تفاعليًا</span></div>
      </section>
      <section className="feature-grid">
        {[
          ['/library', '📚', 'مكتبة الفصول', 'الفصول الأحد عشر ودروسها وحالة كل درس.'],
          ['/labs', '🧪', 'مختبرات التأمين', 'حاسبات ومحاكاة: التجميع، النسبية، المشاركة، الحلول…'],
          ['/quizzes', '📝', 'مركز الاختبارات', 'اختبار شامل واختبار سيناريوهات لكل درس.'],
          ['/exam', '⏱', 'محاكاة الامتحان', 'امتحان مؤقت مع تقرير بالمحاور.'],
          ['/mastery', '🎯', 'لوحة الإتقان', 'تقدمك ونقاط ضعفك وسجل محاولاتك.'],
          ['/review', '🔁', 'المراجعة والأخطاء', 'مراجعة ذكية وبطاقات تذكّر.'],
        ].map(([to, icon, t, d]) => (
          <Link key={to} to={to} className="feature">
            <span className="feature-icon" aria-hidden>{icon}</span>
            <strong>{t}</strong>
            <small>{d}</small>
          </Link>
        ))}
      </section>
      <p className="small muted center">
        محتوى تعليمي أصلي غير رسمي. لا يعيد إنتاج نصوص الكتاب أو أسئلته. الحقوق المحفوظة: <a href="https://t.me/B1Ver" target="_blank" rel="noreferrer">t.me/B1Ver</a>
      </p>
    </div>
  );
}

/* ============================================================ Library */
export function LibraryPage() {
  const { state } = useApp();
  const unlocked = useMemo(() => unlockedLessons(readyLessonOrder, state), [state]);
  const th = state.settings.masteryThreshold;
  return (
    <div className="page-wrap">
      <h1>مكتبة الفصول</h1>
      <p className="muted">الدروس «قيد الإعداد» معروضة كهيكل فقط ولن تظهر كدروس جاهزة قبل اكتمال محتواها ومراجعته.</p>
      <div className="shelf">
        {chapters.map((c) => {
          const ready = c.lessons.filter((l) => l.status !== 'planned').length;
          const done = c.lessons.filter((l) => isMastered(lessonProgress(state, l.id), th)).length;
          return (
            <section key={c.id} className="chapter-card" style={{ ['--accent' as string]: c.accent }}>
              <header>
                <div className="spine-tab" aria-hidden>{c.number}</div>
                <div>
                  <h2>الفصل {c.number}: {c.title}</h2>
                  <p className="muted"><bdi dir="ltr">{c.titleEn}</bdi></p>
                </div>
              </header>
              <p>{c.description}</p>
              <p className="small">جاهز: <bdi dir="ltr">{ready}/{c.lessons.length}</bdi> · متقن: <bdi dir="ltr">{done}</bdi></p>
              <Bar value={done} max={c.lessons.length} tone="good" />
              <ul className="lesson-list">
                {c.lessons.map((l) => {
                  const lp = lessonProgress(state, l.id);
                  const locked = l.status === 'complete' && !unlocked.has(l.id);
                  const m = isMastered(lp, th);
                  return (
                    <li key={l.id}>
                      {l.status === 'planned' ? (
                        <span className="lesson-row disabled">
                          <span>{l.number} {l.title}</span>
                          <StatusBadge status="planned" />
                        </span>
                      ) : (
                        <Link to={`/book/${l.id}`} className={`lesson-row ${locked ? 'locked' : ''}`} aria-disabled={locked}>
                          <span>{locked ? '🔒 ' : m ? '✓ ' : ''}{l.number} {l.title}</span>
                          <span className="small muted"><bdi dir="ltr">{readingPercent(lp, LESSON_SECTIONS.length)}%</bdi></span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ Labs */
export function LabsPage({ labId }: { labId?: string }) {
  if (labId && LABS[labId]) {
    const L = LABS[labId];
    const C = L.Component;
    const lesson = studyableLessons.find((l) => l.labId === labId);
    return (
      <div className="page-wrap lab-page">
        <Link to="/labs" className="btn btn-ghost btn-small">→ كل المختبرات</Link>
        <div className="paper-sheet popstage">
          <C />
        </div>
        {lesson && <p className="small">مرتبط بالدرس: <Link to={`/book/${lesson.id}`}>{lesson.number} {lesson.title}</Link></p>}
      </div>
    );
  }
  return (
    <div className="page-wrap">
      <h1>مختبرات التأمين</h1>
      <p className="muted">كل مختبر يتضمن: الهدف، تعريف المتغيرات، أدوات تحكم، نتائج لحظية، تفسير، «توقّع ثم اكشف»، خطأ شائعًا وتصحيحه، وزر إعادة التجربة.</p>
      <div className="lab-cards">
        {Object.values(LABS).map((l) => {
          const ch = chapters.find((c) => c.id === l.meta.chapterId);
          return (
            <Link key={l.meta.id} to={`/labs/${l.meta.id}`} className={`lab-card ${l.featured ? 'featured' : ''}`} style={{ ['--accent' as string]: ch?.accent }}>
              <span className="small muted">الفصل {ch?.number}: {ch?.title}</span>
              <strong>{l.meta.title}</strong>
              <small>{l.meta.objective}</small>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ Quiz center */
export function QuizCenterPage() {
  const { state } = useApp();
  const unlocked = useMemo(() => unlockedLessons(readyLessonOrder, state), [state]);
  const th = state.settings.masteryThreshold;
  return (
    <div className="page-wrap">
      <h1>مركز الاختبارات</h1>
      <p className="muted">لكل درس اختباران منفصلان. حد الإتقان الحالي <bdi dir="ltr">{th}%</bdi> لكل اختبار (قابل للتعديل من الإعدادات).</p>
      <div className="quiz-shortcuts">
        <Link to="/exam" className="btn">⏱ محاكاة الامتحان</Link>
        <Link to="/quiz/smart/review" className="btn btn-ghost">🔁 مراجعة ذكية لكل أخطائي</Link>
      </div>
      {chapters.filter((c) => c.lessons.some((l) => l.status !== 'planned')).map((c) => (
        <section key={c.id} className="card">
          <h2>الفصل {c.number}: {c.title}</h2>
          <div className="scroll-x">
            <table className="tbl">
              <thead>
                <tr><th>الدرس</th><th>الاختبار الشامل</th><th>السيناريوهات</th><th></th></tr>
              </thead>
              <tbody>
                {c.lessons.filter((l) => l.status !== 'planned').map((l) => {
                  const lp = lessonProgress(state, l.id);
                  const locked = l.status === 'complete' && !unlocked.has(l.id);
                  return (
                    <tr key={l.id}>
                      <td>{locked ? '🔒 ' : ''}{l.number} {l.title}</td>
                      <td>
                        <bdi dir="ltr">{lp.best.mcq !== undefined ? `${lp.best.mcq}%` : '—'}</bdi> <small className="muted">({questionsFor(l.id, 'mcq').length})</small>
                      </td>
                      <td>
                        <bdi dir="ltr">{lp.best.scenario !== undefined ? `${lp.best.scenario}%` : '—'}</bdi> <small className="muted">({questionsFor(l.id, 'scenario').length})</small>
                      </td>
                      <td className="row-actions">
                        <button className="btn btn-small" disabled={locked} onClick={() => navigate(`/quiz/${l.id}/mcq`)}>شامل</button>
                        <button className="btn btn-small btn-ghost" disabled={locked} onClick={() => navigate(`/quiz/${l.id}/scenario`)}>سيناريوهات</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ============================================================ Mastery */
export function MasteryPage() {
  const { state } = useApp();
  const th = state.settings.masteryThreshold;
  const lessons = studyableLessons;
  const masteredCount = lessons.filter((l) => isMastered(lessonProgress(state, l.id), th)).length;
  return (
    <div className="page-wrap">
      <h1>لوحة الإتقان</h1>
      <div className="stats-row">
        <div className="stat"><ProgressRing value={lessons.length ? (masteredCount / lessons.length) * 100 : 0} size={72} /><span>الدروس المتقنة</span></div>
        <div className="stat"><strong><bdi dir="ltr">{Object.values(state.lessons).reduce((s, l) => s + l.attempts.length, 0)}</bdi></strong><span>محاولة اختبار</span></div>
        <div className="stat"><strong><bdi dir="ltr">{Object.values(state.mistakes).filter((m) => !m.resolved).length}</bdi></strong><span>خطأ مفتوح للمراجعة</span></div>
        <div className="stat"><strong><bdi dir="ltr">{state.exams.length}</bdi></strong><span>محاكاة امتحان</span></div>
      </div>
      <div className="mastery-grid">
        {lessons.map((l) => {
          const lp = lessonProgress(state, l.id);
          const weak = weakConcepts(lp);
          const m = isMastered(lp, th);
          return (
            <section key={l.id} className={`mastery-card ${m ? 'mastered' : ''}`}>
              <header>
                <Link to={`/book/${l.id}`}><strong>{l.number} {l.title}</strong></Link>
                {m ? <span className="badge badge-ok">متقن</span> : <span className="badge badge-muted">قيد التعلم</span>}
              </header>
              <dl className="mini-dl">
                <div><dt>الشرح</dt><dd><Bar value={readingPercent(lp, LESSON_SECTIONS.length)} /><bdi dir="ltr">{readingPercent(lp, LESSON_SECTIONS.length)}%</bdi></dd></div>
                <div><dt>التجارب المكتملة</dt><dd><bdi dir="ltr">{lp.labsDone.length}</bdi></dd></div>
                <div><dt>الشامل</dt><dd className={(lp.best.mcq ?? 0) >= th ? 'good' : ''}><bdi dir="ltr">{lp.best.mcq ?? '—'}{lp.best.mcq !== undefined ? '%' : ''}</bdi></dd></div>
                <div><dt>السيناريوهات</dt><dd className={(lp.best.scenario ?? 0) >= th ? 'good' : ''}><bdi dir="ltr">{lp.best.scenario ?? '—'}{lp.best.scenario !== undefined ? '%' : ''}</bdi></dd></div>
                <div><dt>آخر مراجعة</dt><dd>{lp.lastReview ? <bdi dir="ltr">{new Date(lp.lastReview).toLocaleDateString('en-GB')}</bdi> : '—'}</dd></div>
              </dl>
              {weak.length > 0 && <p className="small"><b>نقاط ضعف:</b> {weak.slice(0, 3).map((w) => conceptLabel(w.concept)).join('، ')}</p>}
              {lp.attempts.length > 0 && (
                <details>
                  <summary>سجل المحاولات (<bdi dir="ltr">{lp.attempts.length}</bdi>)</summary>
                  <ul className="attempts">
                    {[...lp.attempts].reverse().slice(0, 10).map((a) => (
                      <li key={a.id}>
                        <bdi dir="ltr">{new Date(a.at).toLocaleString('en-GB')}</bdi> — {a.kind === 'mcq' ? 'شامل' : a.kind === 'scenario' ? 'سيناريوهات' : 'مراجعة'} ({a.mode === 'learn' ? 'تعلم' : 'تقييم'}{a.full ? '' : '، جزئي'}): <bdi dir="ltr">{a.score}%</bdi>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ Review */
export function ReviewPage() {
  const { state } = useApp();
  const [tab, setTab] = useState<'mistakes' | 'cards'>('mistakes');
  const open = Object.values(state.mistakes).filter((m) => !m.resolved).sort((a, b) => b.count - a.count);
  const resolved = Object.values(state.mistakes).filter((m) => m.resolved).length;
  const weakLessonIds = [...new Set(open.map((m) => m.lessonId))];
  const cards = (weakLessonIds.length ? weakLessonIds : readyLessonOrder.slice(0, 3)).flatMap((id) => (getLesson(id)?.summary ?? []).map((c) => ({ ...c, lessonId: id })));
  const [ci, setCi] = useState(0);
  const [flip, setFlip] = useState(false);
  return (
    <div className="page-wrap">
      <h1>سجل الأخطاء والمراجعة</h1>
      <Segmented label="القسم" value={tab} onChange={setTab} options={[{ value: 'mistakes', label: `الأخطاء (${open.length})` }, { value: 'cards', label: 'بطاقات المراجعة' }]} />
      {tab === 'mistakes' ? (
        open.length === 0 ? (
          <EmptyState title="لا توجد أخطاء مفتوحة">
            <p>{resolved ? `صححت ${resolved} خطأ في مراجعات لاحقة. أحسنت!` : 'ستظهر هنا الأسئلة التي أخطأت فيها لمراجعتها.'}</p>
          </EmptyState>
        ) : (
          <>
            <div className="quiz-shortcuts">
              <Link to="/quiz/smart/review" className="btn btn-primary">🔁 ابدأ مراجعة ذكية بأسئلة جديدة على المفاهيم نفسها</Link>
            </div>
            <ul className="mistake-log">
              {open.map((m) => {
                const q = questionById.get(m.qid);
                const s = getStub(m.lessonId);
                return (
                  <li key={m.qid}>
                    <div className="small muted">{s?.number} {s?.title} · {conceptLabel(m.concept)} · تكرر <bdi dir="ltr">{m.count}</bdi></div>
                    <p>{q?.stem}</p>
                    <details>
                      <summary>اعرض التصحيح</summary>
                      <p className="good">✓ {q?.options[q.answer]}</p>
                      <p>{q?.explanation}</p>
                    </details>
                  </li>
                );
              })}
            </ul>
          </>
        )
      ) : cards.length ? (
        <div className="review-cards popstage">
          <p className="muted">{weakLessonIds.length ? 'بطاقات من الدروس التي فيها أخطاء مفتوحة.' : 'بطاقات من أوائل الدروس.'} <bdi dir="ltr">{ci + 1}/{cards.length}</bdi></p>
          <button type="button" className={`flashcard popup ${flip ? 'flipped' : ''}`} onClick={() => setFlip((f) => !f)}>
            <span className="fc-front">{cards[ci].front}</span>
            <span className="fc-back">{cards[ci].back}</span>
          </button>
          <div className="fc-actions">
            <button className="btn btn-ghost" onClick={() => { setFlip(false); setCi((i) => (i - 1 + cards.length) % cards.length); }}>→ السابقة</button>
            <button className="btn" onClick={() => { setFlip(false); setCi((i) => (i + 1) % cards.length); }}>التالية ←</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================ Settings */
export function SettingsPage() {
  const { state, dispatch } = useApp();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<typeof s>) => dispatch({ type: 'settings', patch });
  const doExport = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ifce-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('تم تصدير ملف التقدم.');
  };
  const doImport = async (f: File) => {
    const r = importState(await f.text());
    if (r.ok) {
      dispatch({ type: 'replace', state: r.state });
      setMsg('تم استيراد التقدم بنجاح.');
    } else setMsg(r.error);
  };
  return (
    <div className="page-wrap narrow-wrap">
      <h1>الإعدادات</h1>
      <section className="card settings">
        <h2>العرض</h2>
        <div className="field"><span>المظهر</span><Segmented label="المظهر" value={s.theme} onChange={(v) => set({ theme: v })} options={[{ value: 'system', label: 'حسب النظام' }, { value: 'light', label: 'فاتح' }, { value: 'dark', label: 'داكن' }]} /></div>
        <div className="field"><span>الحركة</span><Segmented label="الحركة" value={s.motion} onChange={(v) => set({ motion: v })} options={[{ value: 'system', label: 'حسب النظام' }, { value: 'reduced', label: 'تقليل الحركة' }, { value: 'full', label: 'كاملة' }]} /></div>
        <NumberField label="حجم الخط" value={s.fontScale} onChange={(v) => set({ fontScale: v })} min={0.85} max={1.4} step={0.05} suffix="×" />
        <label className="check"><input type="checkbox" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} /> صوت تقليب الصفحات</label>
      </section>
      <section className="card settings">
        <h2>الإتقان</h2>
        <NumberField label="حد الإتقان لكل اختبار" value={s.masteryThreshold} onChange={(v) => set({ masteryThreshold: v })} min={50} max={100} step={5} suffix="%" hint="الافتراضي 90%" />
        <label className="check">
          <input type="checkbox" checked={s.teacherMode} onChange={(e) => set({ teacherMode: e.target.checked })} /> وضع العرض للمعلم (فتح جميع الدروس الجاهزة، وتكبير الخط للعرض)
        </label>
      </section>
      <section className="card settings">
        <h2>التقدم والبيانات</h2>
        <p className="small muted">يُحفظ التقدم محليًا في هذا المتصفح فقط. صدّره لنقله إلى جهاز آخر.</p>
        <div className="row-actions">
          <button className="btn" onClick={doExport}>⬇ تصدير التقدم</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>⬆ استيراد التقدم</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>مسح التقدم</button>
        </div>
        {msg && <p role="status" className="small">{msg}</p>}
      </section>
      <section className="card">
        <h2>حول المحتوى</h2>
        <p className="small">محتوى أصلي تعليمي غير رسمي. لا يُعدّ نصًا رسميًا لامتحان IFCE. راجع <Link to="/review-log">سجل المراجعة العلمية</Link> لمعرفة النقاط التي تحتاج تحققًا بشريًا.</p>
        <p className="small">الحقوق المحفوظة: <a href="https://t.me/B1Ver" target="_blank" rel="noreferrer">t.me/B1Ver</a></p>
      </section>
      {confirmReset && (
        <Modal
          title="مسح التقدم"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)} autoFocus>إلغاء</button>
              <button className="btn btn-danger" onClick={() => { dispatch({ type: 'reset' }); setConfirmReset(false); setMsg('تم مسح التقدم.'); }}>نعم، امسح</button>
            </>
          }
        >
          <p>سيُحذف كل التقدم والمحاولات وسجل الأخطاء من هذا المتصفح. يُنصح بالتصدير أولًا.</p>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================ Scientific review log */
export function ReviewLogPage() {
  const planned = chapters.flatMap((c) => c.lessons.filter((l) => l.status === 'planned').map((l) => ({ ...l, ch: c })));
  const reviewLessons = studyableLessons.filter((l) => l.status === 'review');
  return (
    <div className="page-wrap">
      <h1>سجل المراجعة العلمية</h1>
      <p className="muted">
        كل المحتوى في هذا التطبيق أصلي وخضع لتحقق داخلي (صحة مفاتيح الإجابات، والعمليات الحسابية، والاتساق)، لكنه لم يخضع بعد لمراجعة خبير بشري مقابل الإصدار الرابع من منهج IFCE. البنود أدناه تحتاج تحققًا خاصًا قبل اعتمادها.
      </p>
      <section className="card">
        <h2>بنود مفتوحة</h2>
        <ul className="review-log">
          {REVIEW_LOG.map((r) => (
            <li key={r.id}>
              <span className={`badge ${r.status === 'open' ? 'badge-warn' : 'badge-muted'}`}>{r.status === 'open' ? 'مفتوح' : 'تحقق جزئي'}</span>{' '}
              <strong>{r.scope}:</strong> {r.item}
              <p className="small muted">{r.reason}</p>
              {r.sources && (
                <p className="small">
                  مصادر أولية: {r.sources.map((s, i) => (<span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>))}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
      {reviewLessons.length > 0 && (
        <section className="card">
          <h2>دروس تحتاج مراجعة علمية</h2>
          <ul>{reviewLessons.map((l) => <li key={l.id}><Link to={`/book/${l.id}`}>{l.number} {l.title}</Link>: {l.reviewNotes?.join(' — ')}</li>)}</ul>
        </section>
      )}
      <section className="card">
        <h2>دروس قيد الإعداد (هيكل فقط)</h2>
        <p className="small muted"><bdi dir="ltr">{planned.length}</bdi> درسًا لم يُكتب محتواها بعد ولا تظهر كدروس جاهزة.</p>
        <ul className="planned-list">{planned.map((l) => <li key={l.id}>{l.number} {l.title}</li>)}</ul>
      </section>
    </div>
  );
}
