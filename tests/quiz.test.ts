import { buildExam, EXAM_DISTRIBUTION, EXAM_SECONDS, grade, presentQuestions } from '../src/engine/quiz';
import { ALL_QUESTIONS, examPool } from '../src/content';
import type { Question } from '../src/content/types';
import { smartReviewQuestions } from '../src/pages/QuizPage';

describe('presentation and grading', () => {
  const qs = ALL_QUESTIONS.slice(0, 20);
  it('option order is a permutation and deterministic per seed', () => {
    const a = presentQuestions(qs, 7);
    const b = presentQuestions(qs, 7);
    expect(a.map((p) => p.q.id)).toEqual(b.map((p) => p.q.id));
    for (const p of a) expect([...p.order].sort()).toEqual([0, 1, 2, 3]);
  });
  it('grades using original option indices', () => {
    const p = presentQuestions(qs.slice(0, 4), 3);
    const answers: Record<string, number | null> = {};
    p.forEach((x, i) => (answers[x.q.id] = i < 3 ? x.q.answer : (x.q.answer + 1) % 4));
    const g = grade(p, answers);
    expect(g.correct).toBe(3);
    expect(g.score).toBe(75);
    expect(g.records.filter((r) => !r.correct)).toHaveLength(1);
  });
  it('unanswered questions are wrong', () => {
    expect(grade(presentQuestions(qs.slice(0, 2), 1), {}).correct).toBe(0);
  });
});

describe('exam builder', () => {
  it('never duplicates questions and respects the per-area caps', () => {
    const plan = buildExam(examPool, 11);
    expect(new Set(plan.questions.map((q) => q.id)).size).toBe(plan.questions.length);
    for (const d of EXAM_DISTRIBUTION) expect(plan.questions.filter((q) => q.examArea === d.area).length).toBeLessThanOrEqual(d.count);
  });
  it('builds a complete 100-question / 2h exam from a sufficient pool', () => {
    const fake: Question[] = [];
    for (const d of EXAM_DISTRIBUTION) for (let i = 0; i < d.count + 5; i++) fake.push({ ...ALL_QUESTIONS[0], id: `${d.area}-${i}`, examArea: d.area, concept: `c${i % 4}` });
    const plan = buildExam(fake, 5);
    expect(plan.complete).toBe(true);
    expect(plan.questions).toHaveLength(100);
    expect(plan.durationSec).toBe(EXAM_SECONDS);
  });
  it('reports shortages honestly and scales time for partial exams', () => {
    const plan = buildExam(ALL_QUESTIONS.filter((q) => q.examArea === 'risk').slice(0, 5), 1);
    expect(plan.complete).toBe(false);
    expect(plan.questions).toHaveLength(5);
    expect(plan.durationSec).toBe(5 * 72);
    expect(plan.shortages.find((s) => s.area === 'risk')?.available).toBe(5);
  });
});

describe('smart review', () => {
  it('prefers new questions on the same weak concepts', () => {
    const concept = ALL_QUESTIONS[0].concept;
    const same = ALL_QUESTIONS.filter((q) => q.concept === concept);
    const wrong = new Set([same[0].id]);
    const out = smartReviewQuestions(ALL_QUESTIONS, [concept], wrong, 3);
    expect(out.every((q) => q.concept === concept)).toBe(true);
    if (same.length > 1) expect(out[0].id).not.toBe(same[0].id);
  });
});
