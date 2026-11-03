import { useMemo, useState } from 'react';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { getLesson, questionsFor, questionById, examPool } from '../content';
import { useApp } from '../app/store';
import { navigate, Link } from '../app/router';
import { newSeed, mulberry32, shuffle } from '../engine/random';
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER } from '../engine/quiz';
import { lessonProgress, weakConcepts, type QuizMode } from '../engine/progress';
import type { Difficulty, Question } from '../content/types';
import { EmptyState, Segmented } from '../components/ui';

/** Builds a re-test: questions on the same weak concepts, preferring ones not previously answered wrongly. */
export function smartReviewQuestions(pool: Question[], weak: string[], wrongIds: Set<string>, seed: number, max = 10): Question[] {
  const rand = mulberry32(seed);
  const onConcept = pool.filter((q) => weak.includes(q.concept));
  const fresh = shuffle(onConcept.filter((q) => !wrongIds.has(q.id)), rand);
  const again = shuffle(onConcept.filter((q) => wrongIds.has(q.id)), rand);
  return [...fresh, ...again].slice(0, max);
}

export function QuizPage({ lessonId, kind, mode: modeParam }: { lessonId: string; kind: string; mode?: string }) {
  const { state, dispatch } = useApp();
  const [seed, setSeed] = useState(newSeed);
  const [mode, setMode] = useState<QuizMode>(modeParam === 'learn' ? 'learn' : 'assess');
  const [diff, setDiff] = useState<'all' | Difficulty>('all');
  const [started, setStarted] = useState(false);
  const isGlobalReview = lessonId === 'smart';
  const lesson = isGlobalReview ? undefined : getLesson(lessonId);

  const questions = useMemo(() => {
    if (isGlobalReview) {
      const open = Object.values(state.mistakes).filter((m) => !m.resolved);
      const concepts = [...new Set(open.map((m) => m.concept))];
      return smartReviewQuestions(examPool, concepts, new Set(open.map((m) => m.qid)), seed, 15);
    }
    if (!lesson) return [];
    if (kind === 'review') {
      const lp = lessonProgress(state, lesson.id);
      const weak = weakConcepts(lp).map((w) => w.concept);
      const wrong = new Set(Object.values(state.mistakes).filter((m) => m.lessonId === lesson.id && !m.resolved).map((m) => m.qid));
      return smartReviewQuestions(questionsFor(lesson.id), weak, wrong, seed);
    }
    const all = questionsFor(lesson.id, kind === 'scenario' ? 'scenario' : 'mcq');
    return diff === 'all' ? all : all.filter((q) => q.difficulty === diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, kind, diff, seed, isGlobalReview, started]);

  if (!isGlobalReview && !lesson) return <EmptyState title="الدرس غير متاح" />;

  const title = isGlobalReview
    ? 'مراجعة ذكية للأخطاء'
    : `${kind === 'scenario' ? 'اختبار السيناريوهات المتقدمة' : kind === 'review' ? 'مراجعة ذكية' : 'الاختبار الشامل'} — ${lesson!.number} ${lesson!.title}`;
  const full = !isGlobalReview && kind !== 'review' && diff === 'all';
  const back = () => navigate(isGlobalReview ? '/review' : `/book/${lesson!.id}?s=4`);

  if (!started) {
    const total = isGlobalReview || kind === 'review' ? questions.length : questionsFor(lesson!.id, kind === 'scenario' ? 'scenario' : 'mcq').length;
    return (
      <div className="page-wrap narrow-wrap">
        <div className="quiz-setup">
          <h1>{title}</h1>
          {questions.length === 0 ? (
            <EmptyState title="لا توجد أسئلة مناسبة">
              <p>{isGlobalReview || kind === 'review' ? 'لا توجد مفاهيم ضعيفة أو أخطاء مفتوحة حاليًا.' : 'لا توجد أسئلة بهذا المستوى.'}</p>
              <Link to={isGlobalReview ? '/review' : `/book/${lessonId}`} className="btn">العودة</Link>
            </EmptyState>
          ) : (
            <>
              <p>
                عدد الأسئلة: <bdi dir="ltr">{questions.length}</bdi>
                {!full && kind !== 'review' && !isGlobalReview && <> من <bdi dir="ltr">{total}</bdi></>}
              </p>
              <Segmented label="وضع الاختبار" value={mode} onChange={setMode} options={[{ value: 'learn', label: 'التعلم (تصحيح فوري)' }, { value: 'assess', label: 'التقييم (تصحيح بعد التسليم)' }]} />
              {!isGlobalReview && kind !== 'review' && (
                <div className="field">
                  <span>مستوى الصعوبة</span>
                  <Segmented
                    label="مستوى الصعوبة"
                    value={diff}
                    onChange={setDiff}
                    options={[{ value: 'all', label: 'كل المستويات' }, ...DIFFICULTY_ORDER.map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))]}
                  />
                </div>
              )}
              <p className="small muted">
                {full
                  ? `هذه المحاولة الكاملة تُحتسب في الإتقان (الحد ${state.settings.masteryThreshold}%). تُخلط الأسئلة والخيارات في كل محاولة.`
                  : 'هذه محاولة تدريبية جزئية؛ تُسجَّل في سجل المحاولات والأخطاء ولا تُحتسب في حد الإتقان.'}
              </p>
              <button className="btn btn-primary" onClick={() => setStarted(true)}>
                ابدأ
              </button>{' '}
              <button className="btn btn-ghost" onClick={back}>
                العودة
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <QuizRunner
        key={seed}
        title={title}
        questions={questions}
        mode={mode}
        seed={seed}
        threshold={full ? state.settings.masteryThreshold : undefined}
        onExit={() => {
          setStarted(false);
          setSeed(newSeed());
          back();
        }}
        onFinish={(r) => {
          const at = Date.now();
          if (isGlobalReview) {
            // map each answer back to its lesson
            const byLesson = new Map<string, typeof r.records>();
            for (const rec of r.records) {
              const lid = questionById.get(rec.qid)!.lessonId;
              byLesson.set(lid, [...(byLesson.get(lid) ?? []), rec]);
            }
            for (const [lid, recs] of byLesson) {
              const c = recs.filter((x) => x.correct).length;
              dispatch({ type: 'attempt', attempt: { id: `${at}-${lid}`, lessonId: lid, kind: 'review', mode, at, score: Math.round((c / recs.length) * 100), correct: c, total: recs.length, full: false, answers: recs } });
            }
            return;
          }
          dispatch({
            type: 'attempt',
            attempt: { id: String(at), lessonId: lesson!.id, kind: kind === 'review' ? 'review' : (kind as 'mcq' | 'scenario'), mode, at, score: r.score, correct: r.correct, total: r.total, full, answers: r.records },
          });
        }}
      />
    </div>
  );
}
