import { applyMistakes, confirmAdvance, exportState, importState, initialState, isMastered, loadState, markViewed, readingPercent, recordAttempt, saveState, unlockedLessons, weakConcepts, type Attempt } from '../src/engine/progress';

const attempt = (lessonId: string, kind: 'mcq' | 'scenario', score: number, full = true, answers: Attempt['answers'] = []): Attempt => ({
  id: `${lessonId}-${kind}-${score}-${Math.random()}`,
  lessonId,
  kind,
  mode: 'assess',
  at: 1,
  score,
  correct: 0,
  total: 10,
  full,
  answers,
});

describe('mastery and unlocking', () => {
  const order = ['a', 'b', 'c'];
  it('first lesson is open, others locked', () => {
    expect([...unlockedLessons(order, initialState())]).toEqual(['a']);
  });
  it('requires both quizzes ≥ threshold and confirmation', () => {
    let s = initialState();
    s = recordAttempt(s, attempt('a', 'mcq', 90));
    expect(isMastered(s.lessons.a, 90)).toBe(false);
    s = recordAttempt(s, attempt('a', 'scenario', 80));
    expect(isMastered(s.lessons.a, 90)).toBe(false);
    s = recordAttempt(s, attempt('a', 'scenario', 100));
    expect(isMastered(s.lessons.a, 90)).toBe(true);
    expect(unlockedLessons(order, s).has('b')).toBe(false); // not confirmed yet
    s = confirmAdvance(s, 'a');
    expect(unlockedLessons(order, s).has('b')).toBe(true);
    expect(unlockedLessons(order, s).has('c')).toBe(false);
  });
  it('partial attempts do not count toward mastery', () => {
    let s = initialState();
    s = recordAttempt(s, attempt('a', 'mcq', 100, false));
    expect(s.lessons.a.best.mcq).toBeUndefined();
    expect(s.lessons.a.attempts).toHaveLength(1);
  });
  it('threshold is adjustable', () => {
    let s = initialState();
    s = recordAttempt(s, attempt('a', 'mcq', 80));
    s = recordAttempt(s, attempt('a', 'scenario', 80));
    expect(isMastered(s.lessons.a, 90)).toBe(false);
    expect(isMastered(s.lessons.a, 80)).toBe(true);
  });
  it('teacher mode unlocks all', () => {
    const s = initialState();
    s.settings.teacherMode = true;
    expect(unlockedLessons(order, s).size).toBe(3);
  });
});

describe('reading, mistakes and weak concepts', () => {
  it('tracks viewed sections once', () => {
    let s = markViewed(initialState(), 'a', 'intro');
    s = markViewed(s, 'a', 'intro');
    s = markViewed(s, 'a', 'explain');
    expect(readingPercent(s.lessons.a, 5)).toBe(40);
  });
  it('logs mistakes and resolves them when later correct', () => {
    let s = applyMistakes(initialState(), 'a', [{ qid: 'q1', concept: 'x', chosen: 1, correct: false }], 1);
    expect(s.mistakes.q1.resolved).toBe(false);
    s = applyMistakes(s, 'a', [{ qid: 'q1', concept: 'x', chosen: 0, correct: true }], 2);
    expect(s.mistakes.q1.resolved).toBe(true);
  });
  it('computes weak concepts', () => {
    let s = initialState();
    s = recordAttempt(s, attempt('a', 'mcq', 50, true, [
      { qid: '1', concept: 'pool', chosen: 1, correct: false },
      { qid: '2', concept: 'pool', chosen: 1, correct: false },
      { qid: '3', concept: 'risk', chosen: 0, correct: true },
    ]));
    expect(weakConcepts(s.lessons.a).map((w) => w.concept)).toEqual(['pool']);
  });
});

describe('persistence', () => {
  it('round-trips through storage', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    let s = initialState();
    s = recordAttempt(s, attempt('a', 'mcq', 95));
    s.settings.masteryThreshold = 85;
    expect(saveState(s, storage)).toBe(true);
    const back = loadState(storage);
    expect(back.lessons.a.best.mcq).toBe(95);
    expect(back.settings.masteryThreshold).toBe(85);
  });
  it('falls back to a fresh state on corrupt data', () => {
    expect(loadState({ getItem: () => '{not json' }).lessons).toEqual({});
    expect(loadState({ getItem: () => JSON.stringify({ version: 9 }) }).version).toBe(1);
  });
  it('exports and imports', () => {
    const s = recordAttempt(initialState(), attempt('a', 'scenario', 70));
    const r = importState(exportState(s));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.lessons.a.best.scenario).toBe(70);
  });
  it('rejects invalid imports', () => {
    expect(importState('[]').ok).toBe(false);
    expect(importState('nope').ok).toBe(false);
  });
  it('clamps an invalid threshold on import', () => {
    const s = initialState();
    s.settings.masteryThreshold = 5;
    const r = importState(JSON.stringify(s));
    expect(r.ok && r.state.settings.masteryThreshold).toBe(50);
  });
});
