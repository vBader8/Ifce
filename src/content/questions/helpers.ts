import type { Difficulty, ExamArea, Question } from '../types';

/**
 * Compact authoring helper. Authors write the CORRECT option first, followed by three distractors, and one note per
 * option in the same order. Display order is always shuffled at runtime, so the authored position is never shown.
 */
export function makeBank(lessonId: string, examArea: ExamArea) {
  return (
    id: string,
    kind: 'mcq' | 'scenario',
    difficulty: Difficulty,
    concept: string,
    stem: string,
    options: [string, string, string, string],
    explanation: string,
    optionNotes: [string, string, string, string],
  ): Question => ({
    id: `${lessonId}-${id}`,
    lessonId,
    kind,
    difficulty,
    concept,
    stem,
    options,
    answer: 0,
    explanation,
    optionNotes,
    examArea,
  });
}
