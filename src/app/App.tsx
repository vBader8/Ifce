import { useEffect } from 'react';
import { useRoute } from './router';
import { Layout } from './Layout';
import { useApp } from './store';
import { BookPage } from '../pages/BookPage';
import { QuizPage } from '../pages/QuizPage';
import { ExamPage } from '../pages/ExamPage';
import { HomePage, LabsPage, LibraryPage, MasteryPage, QuizCenterPage, ReviewLogPage, ReviewPage, SettingsPage } from '../pages/Pages';
import { EmptyState } from '../components/ui';

function useApplySettings() {
  const { state } = useApp();
  const { theme, motion, fontScale, teacherMode } = state.settings;
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') delete el.dataset.theme;
    else el.dataset.theme = theme;
    if (motion === 'system') delete el.dataset.motion;
    else el.dataset.motion = motion;
    el.style.setProperty('--font-scale', String(fontScale * (teacherMode ? 1.15 : 1)));
  }, [theme, motion, fontScale, teacherMode]);
}

export function App() {
  useApplySettings();
  const { path, parts, query } = useRoute();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [path]);
  let page;
  switch (parts[0]) {
    case undefined:
      page = <HomePage />;
      break;
    case 'library':
      page = <LibraryPage />;
      break;
    case 'book':
      page = <BookPage key={parts[1] ?? 'last'} lessonId={parts[1]} spread={query.get('s') ? Number(query.get('s')) : undefined} />;
      break;
    case 'labs':
      page = <LabsPage labId={parts[1]} />;
      break;
    case 'quizzes':
      page = <QuizCenterPage />;
      break;
    case 'quiz':
      page = <QuizPage key={path + query.toString()} lessonId={parts[1]} kind={parts[2] ?? 'mcq'} mode={query.get('mode') ?? undefined} />;
      break;
    case 'exam':
      page = <ExamPage />;
      break;
    case 'mastery':
      page = <MasteryPage />;
      break;
    case 'review':
      page = <ReviewPage />;
      break;
    case 'review-log':
      page = <ReviewLogPage />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <EmptyState title="الصفحة غير موجودة" />;
  }
  return <Layout path={path}>{page}</Layout>;
}
