import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import {
  applyMistakes,
  confirmAdvance,
  initialState,
  loadState,
  markLabDone,
  markViewed,
  recordAttempt,
  saveState,
  type AppState,
  type Attempt,
  type ExamAttemptRecord,
  type Settings,
} from '../engine/progress';
import { questionById } from '../content';

type Action =
  | { type: 'viewed'; lessonId: string; section: string }
  | { type: 'lab'; lessonId: string; labId: string }
  | { type: 'attempt'; attempt: Attempt }
  | { type: 'exam'; record: ExamAttemptRecord }
  | { type: 'advance'; lessonId: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'location'; lessonId: string; spread: number }
  | { type: 'replace'; state: AppState }
  | { type: 'reset' };

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'viewed':
      return markViewed(state, a.lessonId, a.section);
    case 'lab':
      return markLabDone(state, a.lessonId, a.labId);
    case 'attempt':
      return recordAttempt(state, a.attempt);
    case 'exam': {
      const next = applyMistakes(state, (qid) => questionById.get(qid)?.lessonId ?? 'exam', a.record.answers, a.record.at);
      return { ...next, exams: [...next.exams, a.record].slice(-30) };
    }
    case 'advance':
      return confirmAdvance(state, a.lessonId);
    case 'settings':
      return { ...state, settings: { ...state.settings, ...a.patch } };
    case 'location':
      return { ...state, lastLocation: { lessonId: a.lessonId, spread: a.spread } };
    case 'replace':
      return a.state;
    case 'reset':
      return { ...initialState(), settings: state.settings };
  }
}

const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(null);

export function AppProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, initial, (i) => i ?? loadState());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveState(state);
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
