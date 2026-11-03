import type { Chapter, Lesson, LessonStub, Question } from './types';
import { CHAPTERS } from './chapters/structure';
import { AUTHORED_LESSONS } from './chapters/authored';
import { ALL_QUESTIONS as RAW_QUESTIONS } from './questions/all';
import { LESSON_REVIEW_NOTES, QUESTIONS_UNDER_REVIEW } from './reviewLog';

const ALL_QUESTIONS = RAW_QUESTIONS.map((q) => (QUESTIONS_UNDER_REVIEW[q.id] ? { ...q, needsReview: QUESTIONS_UNDER_REVIEW[q.id] } : q));

export { CHAPTERS };

const lessonMap = new Map<string, Lesson>(
  AUTHORED_LESSONS.map((l) => [l.id, LESSON_REVIEW_NOTES[l.id] ? { ...l, reviewNotes: [...(l.reviewNotes ?? []), ...LESSON_REVIEW_NOTES[l.id]] } : l]),
);

/** Chapters with lesson stubs whose status reflects authored content. */
export const chapters: Chapter[] = CHAPTERS.map((c) => ({
  ...c,
  lessons: c.lessons.map((s) => {
    const authored = lessonMap.get(s.id);
    return authored ? { ...s, status: authored.status } : { ...s, status: 'planned' as const };
  }),
}));

export const getChapter = (id: string) => chapters.find((c) => c.id === id);
export const getLesson = (id: string): Lesson | undefined => lessonMap.get(id);
export const getStub = (id: string): (LessonStub & { chapterId: string }) | undefined => {
  for (const c of chapters) {
    const s = c.lessons.find((l) => l.id === id);
    if (s) return { ...s, chapterId: c.id };
  }
  return undefined;
};

/** Lessons ready for study (status complete), in curriculum order. Lessons flagged `review` are viewable but not gated. */
export const readyLessonOrder: string[] = chapters.flatMap((c) => c.lessons.filter((l) => l.status === 'complete').map((l) => l.id));
export const studyableLessons: Lesson[] = chapters.flatMap((c) =>
  c.lessons.filter((l) => l.status !== 'planned').map((l) => lessonMap.get(l.id)!),
);

const qByLesson = new Map<string, Question[]>();
for (const q of ALL_QUESTIONS) qByLesson.set(q.lessonId, [...(qByLesson.get(q.lessonId) ?? []), q]);

export const questionsFor = (lessonId: string, kind?: 'mcq' | 'scenario') =>
  (qByLesson.get(lessonId) ?? []).filter((q) => !kind || q.kind === kind);

export const questionById = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

/** Exam pool: only questions from lessons whose status is `complete`. */
export const examPool: Question[] = ALL_QUESTIONS.filter((q) => lessonMap.get(q.lessonId)?.status === 'complete' && !q.needsReview);

export { ALL_QUESTIONS };

/* ------------------------------------------------------------------ Search index */
export interface SearchEntry {
  kind: 'lesson' | 'term' | 'chapter';
  label: string;
  sub: string;
  lessonId?: string;
  chapterId: string;
  haystack: string;
}

const normalizeAr = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');

export const searchIndex: SearchEntry[] = [
  ...chapters.map((c) => ({
    kind: 'chapter' as const,
    label: `الفصل ${c.number}: ${c.title}`,
    sub: c.titleEn,
    chapterId: c.id,
    haystack: normalizeAr(`${c.title} ${c.titleEn} ${c.description}`),
  })),
  ...chapters.flatMap((c) =>
    c.lessons.map((l) => ({
      kind: 'lesson' as const,
      label: `${l.number} ${l.title}`,
      sub: l.status === 'planned' ? 'قيد الإعداد' : l.titleEn,
      lessonId: l.id,
      chapterId: c.id,
      haystack: normalizeAr(`${l.title} ${l.titleEn} ${l.outcomes.join(' ')}`),
    })),
  ),
  ...[...lessonMap.values()].flatMap((l) =>
    l.terms.map((t) => ({
      kind: 'term' as const,
      label: t.ar,
      sub: `${t.en} — درس ${l.number}`,
      lessonId: l.id,
      chapterId: l.chapterId,
      haystack: normalizeAr(`${t.ar} ${t.en} ${t.note ?? ''}`),
    })),
  ),
];

export function search(query: string, limit = 12): SearchEntry[] {
  const q = normalizeAr(query.trim());
  if (q.length < 2) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return searchIndex
    .map((e) => ({ e, score: words.reduce((s, w) => s + (e.haystack.includes(w) ? 1 : 0), 0) + (normalizeAr(e.label).includes(q) ? 2 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

/** Number of reading sections tracked per lesson (book spreads). */
export const LESSON_SECTIONS = ['intro', 'explain', 'examples', 'mistakes', 'assess'] as const;
