import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { playFlip } from '../../app/sound';

export interface PageSpec {
  key: string;
  title: string;
  content: ReactNode;
}

export interface Spread {
  id: string;
  /** Right page (read first in an Arabic book): explanation. */
  right: PageSpec;
  /** Left page: interactive experiment / diagram. */
  left: PageSpec;
}

type Flip = { dir: 'next' | 'prev'; from: number; to: number } | null;

function useIsNarrow(breakpoint = 980) {
  const q = `(max-width: ${breakpoint}px)`;
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return narrow;
}

export function reducedMotion(): boolean {
  const attr = document.documentElement.dataset.motion;
  if (attr === 'reduced') return true;
  if (attr === 'full') return false;
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const FLIP_MS = 760;

/** Ghost of a page used on the turning leaf – light to render while animating. */
function PageGhost({ page, side }: { page: PageSpec; side: 'left' | 'right' }) {
  return (
    <div className={`page page-${side} page-ghost`} aria-hidden>
      <div className="page-inner">
        <h2 className="ghost-title">{page.title}</h2>
        <div className="ghost-lines">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ width: `${88 - ((i * 13) % 35)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Page({ page, side, index, total }: { page: PageSpec; side: 'left' | 'right'; index: number; total: number }) {
  return (
    <article className={`page page-${side}`} aria-label={page.title}>
      <div className="page-inner" tabIndex={0}>
        {page.content}
      </div>
      <footer className="page-folio" aria-hidden>
        <bdi dir="ltr">
          {index} / {total}
        </bdi>
      </footer>
    </article>
  );
}

/**
 * Realistic CSS-3D book. Desktop: two facing pages (RTL – right page first). Narrow screens: one page at a time.
 * Navigation: buttons, ArrowLeft/ArrowRight (RTL aware), PageDown/PageUp, swipe/drag, and programmatic `index`.
 */
export function Book3D({
  spreads,
  index,
  onIndexChange,
  sound,
  header,
}: {
  spreads: Spread[];
  index: number;
  onIndexChange: (i: number) => void;
  sound: boolean;
  header?: ReactNode;
}) {
  const narrow = useIsNarrow();
  // In single-page mode we navigate pages: page p -> spread floor(p/2), side right if even.
  const pages = spreads.flatMap((s) => [s.right, s.left]);
  const [sub, setSub] = useState(0); // 0 = right page, 1 = left page (narrow mode)
  const [flip, setFlip] = useState<Flip>(null);
  const timer = useRef<number | undefined>(undefined);
  const bookRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);

  const pos = narrow ? index * 2 + sub : index;
  const max = narrow ? pages.length - 1 : spreads.length - 1;

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!narrow) setSub(0);
  }, [narrow]);

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (flip) return;
      const to = dir === 'next' ? pos + 1 : pos - 1;
      if (to < 0 || to > max) return;
      const commit = () => {
        if (narrow) {
          onIndexChange(Math.floor(to / 2));
          setSub(to % 2);
        } else onIndexChange(to);
        setFlip(null);
        // focus the new right page for screen readers / keyboard users
        requestAnimationFrame(() => bookRef.current?.querySelector<HTMLElement>('.page:not(.page-ghost) .page-inner')?.scrollTo?.({ top: 0 }));
      };
      if (sound) playFlip();
      if (reducedMotion()) {
        commit();
        return;
      }
      setFlip({ dir, from: pos, to });
      timer.current = window.setTimeout(commit, FLIP_MS);
    },
    [flip, pos, max, narrow, onIndexChange, sound],
  );

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"], .modal, .drawer')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
        e.preventDefault();
        go('next');
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        e.preventDefault();
        go('prev');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // drag / swipe
  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, textarea, a, label, [data-nodrag]')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    // RTL book: pulling the page from left to right turns forward.
    go(dx > 0 ? 'next' : 'prev');
  };

  const progress = max > 0 ? (pos / max) * 100 : 100;

  const nav = (
    <div className="book-nav" data-nodrag>
      <button type="button" className="btn btn-round" onClick={() => go('prev')} disabled={pos === 0 || !!flip} aria-label="الصفحة السابقة">
        →
      </button>
      <div className="book-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="التقدم في الدرس">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="book-pos">
        <bdi dir="ltr">
          {pos + 1}/{max + 1}
        </bdi>
      </span>
      <button type="button" className="btn btn-round btn-primary" onClick={() => go('next')} disabled={pos === max || !!flip} aria-label="الصفحة التالية">
        ←
      </button>
    </div>
  );

  if (narrow) {
    const current = pages[pos];
    const target = flip ? pages[flip.to] : null;
    return (
      <div className="book-stage single">
        {header}
        <div className="book single" ref={bookRef} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (drag.current = null)}>
          <div className="book-block">
            {flip && flip.dir === 'next' && target ? (
              <>
                <Page page={target} side={flip.to % 2 === 0 ? 'right' : 'left'} index={flip.to + 1} total={pages.length} />
                <div className="leaf leaf-single turning-next" aria-hidden>
                  <div className="leaf-face front"><PageGhost page={current} side="right" /></div>
                  <div className="leaf-face back paper-back" />
                </div>
              </>
            ) : flip && flip.dir === 'prev' && target ? (
              <>
                <Page page={current} side={pos % 2 === 0 ? 'right' : 'left'} index={pos + 1} total={pages.length} />
                <div className="leaf leaf-single turning-prev-single" aria-hidden>
                  <div className="leaf-face front"><PageGhost page={target} side="right" /></div>
                  <div className="leaf-face back paper-back" />
                </div>
              </>
            ) : (
              <Page page={current} side={pos % 2 === 0 ? 'right' : 'left'} index={pos + 1} total={pages.length} />
            )}
          </div>
        </div>
        {nav}
      </div>
    );
  }

  const cur = spreads[index];
  let leftShown = cur.left;
  let rightShown = cur.right;
  let leaf: ReactNode = null;
  if (flip) {
    const nxt = spreads[flip.to];
    if (flip.dir === 'next') {
      leftShown = nxt.left; // revealed underneath the turning left page
      leaf = (
        <div className="leaf leaf-left turning-next" aria-hidden>
          <div className="leaf-face front"><PageGhost page={cur.left} side="left" /></div>
          <div className="leaf-face back"><PageGhost page={nxt.right} side="right" /></div>
        </div>
      );
    } else {
      rightShown = nxt.right;
      leaf = (
        <div className="leaf leaf-right turning-prev" aria-hidden>
          <div className="leaf-face front"><PageGhost page={cur.right} side="right" /></div>
          <div className="leaf-face back"><PageGhost page={nxt.left} side="left" /></div>
        </div>
      );
    }
  }

  return (
    <div className="book-stage">
      {header}
      <div className="book" ref={bookRef} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (drag.current = null)}>
        <div className="book-block">
          <div className="stack stack-left" aria-hidden />
          <div className="stack stack-right" aria-hidden />
          {/* DOM order: right page first for screen readers; CSS grid places it on the right. */}
          <div className="spread">
            <Page page={rightShown} side="right" index={(flip?.dir === 'prev' ? flip.to : index) * 2 + 1} total={pages.length} />
            <Page page={leftShown} side="left" index={(flip?.dir === 'next' ? flip.to : index) * 2 + 2} total={pages.length} />
          </div>
          <div className="spine" aria-hidden />
          {leaf}
        </div>
      </div>
      {nav}
    </div>
  );
}
