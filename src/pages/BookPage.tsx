import { useEffect, useMemo, useState } from 'react';
import { Book3D, type Spread } from '../components/book/Book3D';
import { AssessPage, ComparePage, ExamplesPage, ExplainPage, IntroPage, LabPage, MasteryGatePage, MistakesPage, SummaryPage, TermsPage } from '../components/book/LessonPages';
import { chapters, getChapter, getLesson, getStub, LESSON_SECTIONS, readyLessonOrder } from '../content';
import { useApp } from '../app/store';
import { unlockedLessons } from '../engine/progress';
import { Link, navigate } from '../app/router';
import { StatusBadge, EmptyState } from '../components/ui';

export function BookPage({ lessonId, spread: spreadParam }: { lessonId?: string; spread?: number }) {
  const { state, dispatch } = useApp();
  const id = lessonId ?? state.lastLocation?.lessonId ?? readyLessonOrder[0];
  const lesson = getLesson(id);
  const stub = getStub(id);
  const unlocked = useMemo(() => unlockedLessons(readyLessonOrder, state), [state]);
  const [index, setIndex] = useState(() => (spreadParam !== undefined ? spreadParam : state.lastLocation?.lessonId === id ? state.lastLocation.spread : 0));
  const [opening, setOpening] = useState(true);
  const [toc, setToc] = useState(false);

  useEffect(() => {
    setIndex(spreadParam ?? 0);
    setOpening(true);
    const t = window.setTimeout(() => setOpening(false), 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, spreadParam]);

  useEffect(() => {
    if (!lesson) return;
    const section = LESSON_SECTIONS[index];
    if (section) dispatch({ type: 'viewed', lessonId: lesson.id, section });
    dispatch({ type: 'location', lessonId: lesson.id, spread: index });
  }, [index, lesson, dispatch]);

  if (!stub) return <EmptyState title="الدرس غير موجود"><Link to="/library" className="btn">مكتبة الفصول</Link></EmptyState>;

  if (!lesson || stub.status === 'planned') {
    const ch = getChapter(stub.chapterId)!;
    return (
      <div className="page-wrap narrow-wrap">
        <EmptyState title={`${stub.number} ${stub.title} — قيد الإعداد`}>
          <p>هذا الدرس جزء من هيكل الفصل {ch.number} «{ch.title}». لم يُعرض بعد لأن محتواه العلمي لم يُكتمل ويُراجع، ولن يُعرض كدرس جاهز قبل ذلك.</p>
          <h4>مخرجات التعلم المخططة</h4>
          <ul>{stub.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
          <Link to="/review-log" className="btn btn-ghost">سجل المراجعة العلمية</Link>
        </EmptyState>
      </div>
    );
  }

  const isGated = lesson.status === 'complete';
  if (isGated && !unlocked.has(lesson.id)) {
    const order = readyLessonOrder.indexOf(lesson.id);
    const prev = getStub(readyLessonOrder[order - 1]);
    return (
      <div className="page-wrap narrow-wrap">
        <EmptyState title="🔒 هذا الدرس مقفل">
          <p>يُفتح الدرس بعد إتقان الدرس السابق {prev ? `«${prev.number} ${prev.title}»` : ''} (حد الإتقان {state.settings.masteryThreshold}% في كل اختبار) وتأكيدك للانتقال.</p>
          {prev && <Link to={`/book/${prev.id}`} className="btn">العودة إلى الدرس السابق</Link>}
          <p className="small muted">يمكن للمعلم فتح جميع الدروس من الإعدادات (وضع المعلم).</p>
        </EmptyState>
      </div>
    );
  }

  const chapter = getChapter(lesson.chapterId)!;
  const firstInChapter = chapter.lessons[0].id === lesson.id;
  const order = readyLessonOrder.indexOf(lesson.id);
  const nextId = order >= 0 ? readyLessonOrder[order + 1] : undefined;

  const spreads: Spread[] = [
    { id: 'intro', right: { key: 'intro', title: lesson.title, content: <IntroPage lesson={lesson} chapter={chapter} firstInChapter={firstInChapter} /> }, left: { key: 'terms', title: 'المصطلحات الأساسية', content: <TermsPage lesson={lesson} /> } },
    { id: 'explain', right: { key: 'explain', title: 'الشرح', content: <ExplainPage lesson={lesson} /> }, left: { key: 'lab', title: 'المختبر التفاعلي', content: <LabPage lesson={lesson} /> } },
    { id: 'examples', right: { key: 'examples', title: 'أمثلة عملية', content: <ExamplesPage lesson={lesson} /> }, left: { key: 'compare', title: 'المقارنة', content: <ComparePage lesson={lesson} /> } },
    { id: 'mistakes', right: { key: 'mistakes', title: 'الأخطاء الشائعة', content: <MistakesPage lesson={lesson} /> }, left: { key: 'summary', title: 'ملخص تفاعلي', content: <SummaryPage lesson={lesson} /> } },
    { id: 'assess', right: { key: 'assess', title: 'التقييم', content: <AssessPage lesson={lesson} /> }, left: { key: 'gate', title: 'الإتقان', content: <MasteryGatePage lesson={lesson} nextLessonId={nextId} /> } },
  ];

  const header = (
    <div className="book-toolbar" data-nodrag>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => setToc(true)} aria-haspopup="dialog">
        ☰ الفهرس
      </button>
      <span className="book-crumb">
        الفصل {chapter.number}: {chapter.title} · <strong>{lesson.number} {lesson.title}</strong>
      </span>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'settings', patch: { sound: !state.settings.sound } })} aria-pressed={state.settings.sound} aria-label={state.settings.sound ? 'كتم صوت التقليب' : 'تشغيل صوت التقليب'}>
        {state.settings.sound ? '🔊' : '🔇'}
      </button>
    </div>
  );

  return (
    <div className={`book-page ${opening ? 'opening' : ''}`} style={{ ['--accent' as string]: chapter.accent }}>
      <Book3D spreads={spreads} index={Math.min(index, spreads.length - 1)} onIndexChange={setIndex} sound={state.settings.sound} header={header} />
      <p className="book-hint muted small">تنقّل بالأسهم ← → أو اسحب الصفحة، أو استخدم الأزرار.</p>
      {toc && (
        <div className="drawer-backdrop" onClick={() => setToc(false)} role="presentation">
          <nav className="drawer" role="dialog" aria-modal="true" aria-label="فهرس الكتاب" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setToc(false)}>
            <div className="drawer-head">
              <h2>الفهرس</h2>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setToc(false)} autoFocus>
                إغلاق
              </button>
            </div>
            {chapters.map((c) => (
              <div key={c.id} className="toc-ch">
                <h3>الفصل {c.number}: {c.title}</h3>
                <ul>
                  {c.lessons.map((l) => {
                    const locked = l.status === 'complete' && !unlocked.has(l.id);
                    return (
                      <li key={l.id} className={l.id === lesson.id ? 'current' : ''}>
                        <button
                          type="button"
                          disabled={l.status === 'planned' || locked}
                          onClick={() => {
                            setToc(false);
                            navigate(`/book/${l.id}`);
                          }}
                        >
                          <span>{locked ? '🔒 ' : ''}{l.number} {l.title}</span>
                          <StatusBadge status={l.status} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
