/** Progress, mastery and persistence model. Pure functions – the React store wraps them. */
import type { ExamArea } from '../content/types';

export type QuizKind = 'mcq' | 'scenario';
export type QuizMode = 'learn' | 'assess';

export interface AnswerRecord {
  qid: string;
  concept: string;
  /** index into the ORIGINAL options array */
  chosen: number | null;
  correct: boolean;
}

export interface Attempt {
  id: string;
  lessonId: string;
  kind: QuizKind | 'review';
  mode: QuizMode;
  at: number;
  /** percentage 0..100 */
  score: number;
  correct: number;
  total: number;
  /** true when every question of the official lesson quiz was included (counts toward mastery) */
  full: boolean;
  answers: AnswerRecord[];
}

export interface LessonProgress {
  viewed: string[];
  labsDone: string[];
  best: Partial<Record<QuizKind, number>>;
  attempts: Attempt[];
  lastReview?: number;
  advanceConfirmed?: boolean;
}

export interface MistakeEntry {
  qid: string;
  lessonId: string;
  concept: string;
  count: number;
  lastAt: number;
  /** answered correctly in a later review */
  resolved: boolean;
}

export interface ExamAttemptRecord {
  id: string;
  at: number;
  durationSec: number;
  usedSec: number;
  total: number;
  correct: number;
  score: number;
  byArea: Partial<Record<ExamArea, { correct: number; total: number }>>;
  answers: AnswerRecord[];
  partial: boolean;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  motion: 'system' | 'reduced' | 'full';
  masteryThreshold: number;
  teacherMode: boolean;
  fontScale: number;
}

export interface AppState {
  version: 1;
  settings: Settings;
  lessons: Record<string, LessonProgress>;
  mistakes: Record<string, MistakeEntry>;
  exams: ExamAttemptRecord[];
  lastLocation?: { lessonId: string; spread: number };
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: true,
  motion: 'system',
  masteryThreshold: 90,
  teacherMode: false,
  fontScale: 1,
};

export const initialState = (): AppState => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  lessons: {},
  mistakes: {},
  exams: [],
});

export const emptyLesson = (): LessonProgress => ({ viewed: [], labsDone: [], best: {}, attempts: [] });

export function lessonProgress(state: AppState, lessonId: string): LessonProgress {
  return state.lessons[lessonId] ?? emptyLesson();
}

function withLesson(state: AppState, lessonId: string, fn: (lp: LessonProgress) => LessonProgress): AppState {
  return { ...state, lessons: { ...state.lessons, [lessonId]: fn(lessonProgress(state, lessonId)) } };
}

export function markViewed(state: AppState, lessonId: string, sectionId: string): AppState {
  const lp = lessonProgress(state, lessonId);
  if (lp.viewed.includes(sectionId)) return state;
  return withLesson(state, lessonId, (l) => ({ ...l, viewed: [...l.viewed, sectionId], lastReview: Date.now() }));
}

export function markLabDone(state: AppState, lessonId: string, labId: string): AppState {
  const lp = lessonProgress(state, lessonId);
  if (lp.labsDone.includes(labId)) return state;
  return withLesson(state, lessonId, (l) => ({ ...l, labsDone: [...l.labsDone, labId] }));
}

export function recordAttempt(state: AppState, attempt: Attempt): AppState {
  let next = withLesson(state, attempt.lessonId, (l) => {
    const best = { ...l.best };
    if (attempt.full && (attempt.kind === 'mcq' || attempt.kind === 'scenario')) {
      best[attempt.kind] = Math.max(best[attempt.kind] ?? 0, attempt.score);
    }
    return { ...l, best, attempts: [...l.attempts, attempt].slice(-50), lastReview: attempt.at };
  });
  next = applyMistakes(next, attempt.lessonId, attempt.answers, attempt.at);
  return next;
}

/** Updates the mistakes log. `lessonOf` lets exam answers map back to their lesson. */
export function applyMistakes(state: AppState, lessonId: string | ((qid: string) => string), answers: AnswerRecord[], at: number): AppState {
  const mistakes = { ...state.mistakes };
  for (const a of answers) {
    const lid = typeof lessonId === 'function' ? lessonId(a.qid) : lessonId;
    const prev = mistakes[a.qid];
    if (!a.correct) {
      mistakes[a.qid] = { qid: a.qid, lessonId: lid, concept: a.concept, count: (prev?.count ?? 0) + 1, lastAt: at, resolved: false };
    } else if (prev && !prev.resolved) {
      mistakes[a.qid] = { ...prev, resolved: true, lastAt: at };
    }
  }
  return { ...state, mistakes };
}

export function isMastered(lp: LessonProgress, threshold: number): boolean {
  return (lp.best.mcq ?? 0) >= threshold && (lp.best.scenario ?? 0) >= threshold;
}

export function confirmAdvance(state: AppState, lessonId: string): AppState {
  return withLesson(state, lessonId, (l) => ({ ...l, advanceConfirmed: true }));
}

/**
 * A lesson is unlocked when it is the first in the ordered list of ready lessons, or when the previous ready lesson
 * is mastered AND the learner confirmed moving on. Teacher mode unlocks everything.
 */
export function unlockedLessons(orderedIds: string[], state: AppState): Set<string> {
  const set = new Set<string>();
  if (state.settings.teacherMode) {
    orderedIds.forEach((id) => set.add(id));
    return set;
  }
  for (let i = 0; i < orderedIds.length; i++) {
    if (i === 0) {
      set.add(orderedIds[i]);
      continue;
    }
    const prev = lessonProgress(state, orderedIds[i - 1]);
    if (set.has(orderedIds[i - 1]) && isMastered(prev, state.settings.masteryThreshold) && prev.advanceConfirmed) set.add(orderedIds[i]);
    else break;
  }
  return set;
}

/** Concepts answered wrongly more often than correctly in the lesson's attempts (most recent first weighting). */
export function weakConcepts(lp: LessonProgress): { concept: string; wrong: number; right: number }[] {
  const tally = new Map<string, { wrong: number; right: number }>();
  for (const at of lp.attempts) {
    for (const a of at.answers) {
      const t = tally.get(a.concept) ?? { wrong: 0, right: 0 };
      if (a.correct) t.right++;
      else t.wrong++;
      tally.set(a.concept, t);
    }
  }
  return [...tally.entries()]
    .filter(([, t]) => t.wrong > 0 && t.wrong >= t.right * 0.5)
    .map(([concept, t]) => ({ concept, ...t }))
    .sort((a, b) => b.wrong - a.wrong);
}

export function readingPercent(lp: LessonProgress, totalSections: number): number {
  if (totalSections <= 0) return 0;
  return Math.round((Math.min(lp.viewed.length, totalSections) / totalSections) * 100);
}

/* ------------------------------------------------------------------ Persistence */

export const STORAGE_KEY = 'ifce-living-book:v1';

export function isValidState(x: unknown): x is AppState {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return (
    s.version === 1 &&
    typeof s.settings === 'object' &&
    s.settings !== null &&
    typeof s.lessons === 'object' &&
    s.lessons !== null &&
    typeof s.mistakes === 'object' &&
    s.mistakes !== null &&
    Array.isArray(s.exams)
  );
}

/** Merge a loaded state with defaults so new settings fields added later do not break old saves. */
export function normalizeState(s: AppState): AppState {
  const lessons: Record<string, LessonProgress> = {};
  for (const [k, v] of Object.entries(s.lessons)) lessons[k] = { ...emptyLesson(), ...v, best: { ...(v?.best ?? {}) } };
  const threshold = Number(s.settings.masteryThreshold);
  return {
    ...initialState(),
    ...s,
    settings: {
      ...DEFAULT_SETTINGS,
      ...s.settings,
      masteryThreshold: Number.isFinite(threshold) ? Math.min(100, Math.max(50, threshold)) : 90,
    },
    lessons,
  };
}

export function loadState(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): AppState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? normalizeState(parsed) : initialState();
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify({ app: 'ifce-living-book', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importState(json: string): { ok: true; state: AppState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    const candidate = parsed && parsed.app === 'ifce-living-book' ? parsed.state : parsed;
    if (!isValidState(candidate)) return { ok: false, error: 'الملف لا يحتوي على بيانات تقدم صالحة لهذا التطبيق.' };
    return { ok: true, state: normalizeState(candidate) };
  } catch {
    return { ok: false, error: 'تعذّر قراءة الملف: صيغة JSON غير صالحة.' };
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}
