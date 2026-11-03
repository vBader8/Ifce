import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, navigate } from './router';
import { search, type SearchEntry } from '../content';
import { useApp } from './store';

const NAV = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/library', label: 'المكتبة', icon: '📚' },
  { to: '/book', label: 'الكتاب الحي', icon: '📖' },
  { to: '/labs', label: 'المختبرات', icon: '🧪' },
  { to: '/quizzes', label: 'الاختبارات', icon: '📝' },
  { to: '/exam', label: 'محاكاة الامتحان', icon: '⏱' },
  { to: '/mastery', label: 'الإتقان', icon: '🎯' },
  { to: '/review', label: 'المراجعة', icon: '🔁' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙' },
];

function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = search(q);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);
  const go = (r: SearchEntry) => {
    setOpen(false);
    setQ('');
    navigate(r.lessonId ? `/book/${r.lessonId}` : '/library');
  };
  return (
    <div className="search" ref={ref} role="search">
      <input
        type="search"
        placeholder="ابحث عن مفهوم أو مصطلح…"
        aria-label="بحث عن المفاهيم"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && results[active]) go(results[active]);
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-expanded={open && results.length > 0}
        aria-controls="search-results"
        role="combobox"
        aria-autocomplete="list"
      />
      {open && q.trim().length >= 2 && (
        <ul className="search-results" id="search-results" role="listbox">
          {results.length === 0 && <li className="muted">لا نتائج</li>}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.label}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => go(r)}>
                <span className="sr-kind">{r.kind === 'term' ? 'مصطلح' : r.kind === 'lesson' ? 'درس' : 'فصل'}</span>
                <strong>{r.label}</strong>
                <small dir="auto">{r.sub}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const { state } = useApp();
  useEffect(() => setMenu(false), [path]);
  const isActive = (to: string) => (to === '/' ? path === '/' : path.startsWith(to));
  return (
    <div className={`app ${state.settings.teacherMode ? 'teacher' : ''}`}>
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="IFCE Living Book — الرئيسية">
          <span className="brand-mark" aria-hidden>
            <i />
            <i />
          </span>
          <span className="brand-text">
            <strong>IFCE Living Book</strong>
            <small>أكاديمية أساسيات التأمين</small>
          </span>
        </Link>
        <SearchBox />
        <button type="button" className="menu-btn" aria-expanded={menu} aria-controls="mainnav" onClick={() => setMenu((m) => !m)} aria-label="القائمة">
          ☰
        </button>
        <nav id="mainnav" className={`mainnav ${menu ? 'open' : ''}`} aria-label="التنقل الرئيسي">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={isActive(n.to) ? 'active' : ''} aria-current={isActive(n.to) ? 'page' : undefined}>
              <span aria-hidden>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {state.settings.teacherMode && <div className="teacher-ribbon">وضع العرض للمعلم مفعّل — جميع الدروس الجاهزة مفتوحة</div>}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
