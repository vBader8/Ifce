import type { Difficulty, ExamArea, Question } from '../content/types';
import { mulberry32, shuffle } from './random';
import type { AnswerRecord } from './progress';

export interface PresentedQuestion {
  q: Question;
  /** order[i] = index in q.options shown at display position i */
  order: number[];
}

export function presentQuestions(questions: Question[], seed: number, shuffleQuestions = true): PresentedQuestion[] {
  const rand = mulberry32(seed);
  const qs = shuffleQuestions ? shuffle(questions, rand) : questions.slice();
  return qs.map((q) => ({ q, order: shuffle([0, 1, 2, 3], rand) }));
}

export function isCorrect(q: Question, chosenOriginal: number | null): boolean {
  return chosenOriginal !== null && chosenOriginal === q.answer;
}

export function grade(presented: PresentedQuestion[], answers: Record<string, number | null>): {
  correct: number;
  total: number;
  score: number;
  records: AnswerRecord[];
} {
  const records = presented.map(({ q }) => {
    const chosen = answers[q.id] ?? null;
    return { qid: q.id, concept: q.concept, chosen, correct: isCorrect(q, chosen) };
  });
  const correct = records.filter((r) => r.correct).length;
  const total = presented.length;
  return { correct, total, score: total ? Math.round((correct / total) * 100) : 0, records };
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
  expert: 'خبير',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

/* ------------------------------------------------------------------ Exam */

export const EXAM_DISTRIBUTION: { area: ExamArea; label: string; count: number }[] = [
  { area: 'risk', label: 'الخطر والتأمين', count: 18 },
  { area: 'market', label: 'سوق التأمين', count: 10 },
  { area: 'legal', label: 'المبادئ القانونية لعقود التأمين', count: 36 },
  { area: 'regulation', label: 'التنظيم والرقابة', count: 12 },
  { area: 'ethics', label: 'السلوك الأخلاقي والحوكمة', count: 2 },
  { area: 'process', label: 'إجراءات التأمين', count: 10 },
  { area: 'products', label: 'منتجات التأمين وخدمة العملاء', count: 12 },
];

export const EXAM_TOTAL = 100;
export const EXAM_SECONDS = 2 * 60 * 60;
export const SECONDS_PER_QUESTION = EXAM_SECONDS / EXAM_TOTAL;

export interface ExamPlan {
  questions: Question[];
  shortages: { area: ExamArea; label: string; required: number; available: number }[];
  complete: boolean;
  durationSec: number;
}

/** Builds an exam following the distribution. Never pads with duplicated or unverified questions. */
export function buildExam(pool: Question[], seed: number): ExamPlan {
  const rand = mulberry32(seed);
  const chosen: Question[] = [];
  const shortages: ExamPlan['shortages'] = [];
  for (const d of EXAM_DISTRIBUTION) {
    const inArea = shuffle(
      pool.filter((q) => q.examArea === d.area),
      rand,
    );
    // Prefer covering many concepts: round-robin over concepts.
    const byConcept = new Map<string, Question[]>();
    for (const q of inArea) byConcept.set(q.concept, [...(byConcept.get(q.concept) ?? []), q]);
    const picked: Question[] = [];
    while (picked.length < d.count && [...byConcept.values()].some((l) => l.length)) {
      for (const list of byConcept.values()) {
        if (picked.length >= d.count) break;
        const q = list.shift();
        if (q) picked.push(q);
      }
    }
    if (picked.length < d.count) shortages.push({ area: d.area, label: d.label, required: d.count, available: picked.length });
    chosen.push(...picked);
  }
  const questions = shuffle(chosen, rand);
  return {
    questions,
    shortages,
    complete: shortages.length === 0,
    durationSec: shortages.length === 0 ? EXAM_SECONDS : Math.round(questions.length * SECONDS_PER_QUESTION),
  };
}
