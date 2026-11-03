import { ALL_QUESTIONS, chapters, examPool, getLesson, questionsFor, readyLessonOrder, search, studyableLessons } from '../../src/content';
import { LABS } from '../../src/labs/registry';
import { CONCEPT_LABELS } from '../../src/content/concepts';

describe('question bank integrity', () => {
  it('has unique ids', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_QUESTIONS.map((q) => [q.id, q] as const))('%s is well-formed', (_id, q) => {
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options.map((o) => o.trim())).size).toBe(4); // no duplicate options
    expect(q.options.every((o) => o.trim().length > 0)).toBe(true);
    expect([0, 1, 2, 3]).toContain(q.answer);
    expect(q.optionNotes).toHaveLength(4);
    expect(q.optionNotes.every((n) => n.trim().length > 0)).toBe(true);
    expect(q.explanation.trim().length).toBeGreaterThan(5);
    expect(q.stem.trim().length).toBeGreaterThan(5);
    expect(getLesson(q.lessonId)).toBeDefined();
    // the note for the keyed answer must mark it as correct; notes for distractors must not
    expect(q.optionNotes[q.answer]).toMatch(/صحيح/);
    q.optionNotes.forEach((n, i) => {
      if (i !== q.answer) expect(n.startsWith('صحيح')).toBe(false);
    });
  });

  it('every concept tag has an Arabic label', () => {
    const missing = [...new Set(ALL_QUESTIONS.map((q) => q.concept))].filter((c) => !CONCEPT_LABELS[c]);
    expect(missing).toEqual([]);
  });

  it('scenario questions avoid an obviously longer correct option (length cue)', () => {
    const offenders = ALL_QUESTIONS.filter((q) => q.kind === 'scenario').filter((q) => {
      const correct = q.options[q.answer].length;
      const others = q.options.filter((_, i) => i !== q.answer).map((o) => o.length);
      return correct > Math.max(...others) * 1.15;
    });
    expect(offenders.map((q) => q.id)).toEqual([]);
  });

  it('correct option is not the longest in the majority of scenario questions', () => {
    const sc = ALL_QUESTIONS.filter((q) => q.kind === 'scenario');
    const longest = sc.filter((q) => q.options[q.answer].length > Math.max(...q.options.filter((_, i) => i !== q.answer).map((o) => o.length)));
    expect(longest.length / sc.length).toBeLessThan(0.5);
  });
});

describe('lessons', () => {
  it('every complete lesson has both quizzes with enough questions', () => {
    for (const id of readyLessonOrder) {
      expect(questionsFor(id, 'mcq').length, id).toBeGreaterThanOrEqual(6);
      expect(questionsFor(id, 'scenario').length, id).toBeGreaterThanOrEqual(4);
    }
  });

  it('every studyable lesson has full pedagogical structure and an existing lab', () => {
    for (const l of studyableLessons) {
      expect(l.objectives.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.definition.length).toBeGreaterThan(20);
      expect(l.terms.length).toBeGreaterThan(0);
      expect(l.explanation.core.length).toBeGreaterThanOrEqual(3);
      expect(l.explanation.simple.length).toBeGreaterThan(0);
      expect(l.explanation.deep.length).toBeGreaterThan(0);
      expect(l.examples.map((e) => e.level).sort()).toEqual(['advanced', 'medium', 'simple']);
      expect(l.mistakes.length).toBeGreaterThan(0);
      expect(l.summary.length).toBeGreaterThan(2);
      expect(LABS[l.labId], `${l.id} lab ${l.labId}`).toBeDefined();
    }
  });

  it('lesson stubs and authored lessons agree', () => {
    for (const l of studyableLessons) {
      const ch = chapters.find((c) => c.id === l.chapterId)!;
      const stub = ch.lessons.find((s) => s.id === l.id)!;
      expect(stub.number).toBe(l.number);
      expect(stub.title).toBe(l.title);
    }
  });

  it('has all 11 chapters', () => {
    expect(chapters.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('exam pool contains only questions from complete lessons', () => {
    expect(examPool.every((q) => getLesson(q.lessonId)?.status === 'complete')).toBe(true);
  });

  it('every lab has a predict question with a valid answer', () => {
    for (const l of Object.values(LABS)) {
      expect(l.meta.predict.answer).toBeLessThan(l.meta.predict.options.length);
      expect(l.meta.objective.length).toBeGreaterThan(10);
      expect(l.meta.variables.length).toBeGreaterThan(0);
      expect(l.meta.mistake.correction.length).toBeGreaterThan(5);
    }
  });
});


describe('concept search', () => {
  it('finds lessons and terms in Arabic regardless of hamza/taa marbuta forms', () => {
    expect(search('النسبيه').some((r) => r.lessonId === 'c7-l5')).toBe(true);
    expect(search('اعادة التامين').some((r) => r.lessonId === 'c2-l3')).toBe(true);
  });
  it('finds English terms', () => {
    expect(search('Subrogation').some((r) => r.lessonId?.startsWith('c8'))).toBe(true);
  });
  it('ignores very short queries', () => {
    expect(search('ا')).toEqual([]);
  });
});
