/**
 * Content model for the IFCE Living Book.
 * Content (chapters, lessons, questions) is pure data and is kept separate from UI components.
 */

/**
 * complete  – authored originally, internally checked (answer keys, calculations) and ready to study.
 * review    – authored but contains points that need human scientific / regulatory review. Shown with a warning
 *             banner, never counted as a "ready" lesson, and excluded from the exam pool.
 * planned   – structure and learning outcomes only. Not presented as a lesson.
 */
export type ContentStatus = 'complete' | 'review' | 'planned';

export type ExamArea = 'risk' | 'market' | 'legal' | 'regulation' | 'ethics' | 'process' | 'products';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Term {
  ar: string;
  en: string;
  note?: string;
}

export interface Example {
  level: 'simple' | 'medium' | 'advanced';
  title: string;
  scenario: string;
  steps?: string[];
  takeaway: string;
}

export interface Comparison {
  /** The two (or more) related concepts being compared. */
  items: string[];
  rows: { aspect: string; values: string[] }[];
}

export interface Mistake {
  mistake: string;
  correction: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  /** e.g. "1.3" */
  number: string;
  title: string;
  titleEn: string;
  status: ContentStatus;
  objectives: string[];
  definition: string;
  terms: Term[];
  explanation: {
    /** Main comprehensive explanation – paragraphs. */
    core: string[];
    /** "اشرح لي ببساطة" layer. */
    simple: string[];
    /** "تعمّق أكثر" layer. */
    deep: string[];
  };
  examples: Example[];
  comparison?: Comparison;
  mistakes: Mistake[];
  summary: Flashcard[];
  /** Interactive page shown on the left page of the book. */
  labId: string;
  /** Points that a subject expert must review before the lesson can be treated as authoritative. */
  reviewNotes?: string[];
}

export interface LessonStub {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  status: ContentStatus;
  outcomes: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  description: string;
  examAreas: ExamArea[];
  /** Planned lessons structure (always present, even if content is not yet authored). */
  lessons: LessonStub[];
  accent: string;
}

export interface Question {
  id: string;
  lessonId: string;
  kind: 'mcq' | 'scenario';
  difficulty: Difficulty;
  /** Concept tag – questions sharing a concept can re-test the same idea in a new way. */
  concept: string;
  stem: string;
  options: [string, string, string, string];
  /** Index of the correct option in `options` (options are shuffled at runtime). */
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  /** Why each option is right/wrong – same order as `options`. */
  optionNotes: [string, string, string, string];
  examArea: ExamArea;
}

export interface ReviewLogEntry {
  id: string;
  scope: string;
  item: string;
  reason: string;
  status: 'open' | 'partially-verified';
  sources?: { label: string; url: string }[];
}
