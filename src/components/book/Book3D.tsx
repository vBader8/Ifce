import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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

type Dir = 'next' | 'prev';
type Flip = { dir: Dir; to: number } | null;

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

/** Full turn duration (ms). A partially dragged page finishes in proportionally less time. */
export const FLIP_MS = 820;
/** Fraction of the turn after which a released drag completes instead of falling back. */
export const DRAG_COMMIT = 0.3;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Geometry of the turning leaf for progress p (0 = flat at start, 1 = turned over).
 * Exported for tests. Angles follow the RTL book: forward turns lift the LEFT page over the spine to the right.
 */
export function leafGeometry(p: number, dir: Dir, single: boolean) {
  const q = clamp01(p);
  const arc = Math.sin(q * Math.PI); // 0 at rest, 1 when the page stands upright
  let angle: number;
  if (single) angle = dir === 'next' ? 180 * q : 180 * (1 - q);
  else angle = dir === 'next' ? 180 * q : -180 * q;
  return {
    angle,
    lift: arc * 18, // px towards the reader at mid-turn
    curl: arc * (dir === 'next' ? -1.2 : 1.2) * (single ? 0.6 : 1), // slight skew = paper bending (kept small so the leaf stays inside the book)
    shade: arc, // lighting on the leaf faces
    cast: single && dir === 'prev' ? q * 0.5 : (1 - q) * 0.55 * Math.min(1, q * 8), // shadow on the revealed page
  };
}

/** Light-weight copy of a page shown on the turning leaf while it moves. */
function PageGhost({ page, side }: { page: PageSpec; side: 'left' | 'right' }) {
  return (
    <div className={`page page-${side} page-ghost`} aria-hidden>
      <div className="page-inner">
        <h2 className="ghost-title">{page.title}</h2>
        <div className="ghost-lines">
          {Array.from({ length: 11 }).map((_, i) => (
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
 * Navigation: buttons, ArrowLeft/ArrowRight (RTL aware), PageDown/PageUp, and dragging the page itself – the leaf
 * follows the pointer and completes or falls back on release. Per-frame motion is written straight to DOM refs so the
 * (possibly heavy) page content never re-renders during a turn.
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
  const pages = spreads.flatMap((s) => [s.right, s.left]);
  const [sub, setSub] = useState(0); // 0 = right page, 1 = left page (narrow mode)
  const [flip, setFlip] = useState<Flip>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const castRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const raf = useRef<number | undefined>(undefined);
  const autoplay = useRef(false); // start the turn animation as soon as the leaf mounts
  const drag = useRef<{ x: number; y: number; id: number; active: boolean } | null>(null);

  const pos = narrow ? index * 2 + sub : index;
  const max = narrow ? pages.length - 1 : spreads.length - 1;

  useEffect(() => () => cancelAnimationFrame(raf.current ?? 0), []);
  useEffect(() => {
    if (!narrow) setSub(0);
  }, [narrow]);

  const apply = useCallback(
    (p: number, f: Flip = flip) => {
      progress.current = p;
      if (!f) return;
      const g = leafGeometry(p, f.dir, narrow);
      const leaf = leafRef.current;
      if (leaf) {
        leaf.style.transform = `rotateY(${g.angle}deg) translateZ(${g.lift}px) skewY(${g.curl}deg)`;
        leaf.style.setProperty('--shade', g.shade.toFixed(3));
      }
      if (castRef.current) castRef.current.style.opacity = g.cast.toFixed(3);
    },
    [flip, narrow],
  );

  const commit = useCallback(
    (to: number) => {
      if (narrow) {
        onIndexChange(Math.floor(to / 2));
        setSub(to % 2);
      } else onIndexChange(to);
      setFlip(null);
      progress.current = 0;
      requestAnimationFrame(() => bookRef.current?.querySelectorAll<HTMLElement>('.page-inner').forEach((el) => el.scrollTo?.({ top: 0 })));
    },
    [narrow, onIndexChange],
  );

  const animateTo = useCallback(
    (target: 0 | 1, f: NonNullable<Flip>) => {
      cancelAnimationFrame(raf.current ?? 0);
      const from = progress.current;
      const dur = Math.max(160, FLIP_MS * Math.abs(target - from));
      const t0 = performance.now();
      const step = (now: number) => {
        const t = clamp01((now - t0) / dur);
        apply(from + (target - from) * easeInOut(t), f);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else if (target === 1) commit(f.to);
        else {
          setFlip(null);
          progress.current = 0;
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, commit],
  );

  // When a leaf mounts: position it, and run the turn if it was started by a button or key.
  useLayoutEffect(() => {
    if (!flip) return;
    apply(progress.current, flip);
    if (autoplay.current) {
      autoplay.current = false;
      animateTo(1, flip);
    }
  }, [flip, apply, animateTo]);

  const canGo = (dir: Dir) => (dir === 'next' ? pos < max : pos > 0);

  const go = useCallback(
    (dir: Dir) => {
      if (flip || !canGo(dir)) return;
      const to = dir === 'next' ? pos + 1 : pos - 1;
      if (sound) playFlip();
      if (reducedMotion()) {
        commit(to);
        return;
      }
      progress.current = 0;
      autoplay.current = true;
      setFlip({ dir, to });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flip, pos, max, sound, commit],
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

  // drag: the leaf follows the pointer (RTL: pulling from left to right turns forward)
  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (flip || t.closest('button, input, select, textarea, a, label, summary, [data-nodrag]')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      const dir: Dir = dx > 0 ? 'next' : 'prev';
      if (!canGo(dir) || reducedMotion()) return; // reduced motion: decide on release only
      d.active = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.classList.add('is-turning');
      progress.current = 0;
      autoplay.current = false;
      setFlip({ dir, to: dir === 'next' ? pos + 1 : pos - 1 });
      return;
    }
    const width = (bookRef.current?.clientWidth ?? 800) * (narrow ? 0.9 : 0.5);
    const signed = flip?.dir === 'prev' ? -dx : dx;
    apply(clamp01(signed / width));
  };
  const endDrag = (e: React.PointerEvent, cancelled = false) => {
    const d = drag.current;
    drag.current = null;
    document.body.classList.remove('is-turning');
    if (!d || d.id !== e.pointerId) return;
    if (d.active && flip) {
      const done = !cancelled && progress.current > DRAG_COMMIT;
      if (done && sound) playFlip();
      animateTo(done ? 1 : 0, flip);
      return;
    }
    // reduced motion / quick swipe without an active leaf
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (cancelled || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    go(dx > 0 ? 'next' : 'prev');
  };

  const pct = max > 0 ? (pos / max) * 100 : 100;
  // thickness of the read / unread page blocks (RTL: read pages pile up on the right)
  const blockVars = { ['--read' as string]: (pos / Math.max(1, max)).toFixed(3) };

  const nav = (
    <div className="book-nav" data-nodrag>
      <button type="button" className="btn btn-round" onClick={() => go('prev')} disabled={pos === 0 || !!flip} aria-label="الصفحة السابقة">
        →
      </button>
      <div className="book-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="التقدم في الدرس">
        <span style={{ width: `${pct}%` }} />
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

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: React.PointerEvent) => endDrag(e),
    onPointerCancel: (e: React.PointerEvent) => endDrag(e, true),
  };

  if (narrow) {
    const current = pages[pos];
    const target = flip ? pages[flip.to] : null;
    const sideOf = (p: number) => (p % 2 === 0 ? 'right' : 'left');
    return (
      <div className="book-stage single">
        {header}
        <div className={`book single ${flip ? 'turning' : ''}`} ref={bookRef} {...handlers} style={blockVars}>
          <div className="book-block">
            <div className="stack stack-right" aria-hidden />
            {flip && target ? (
              flip.dir === 'next' ? (
                <>
                  <Page page={target} side={sideOf(flip.to)} index={flip.to + 1} total={pages.length} />
                  <div className="cast cast-full" ref={castRef} aria-hidden />
                  <div className="leaf leaf-single" ref={leafRef} aria-hidden>
                    <div className="leaf-face front">
                      <PageGhost page={current} side="right" />
                    </div>
                    <div className="leaf-face back paper-back" />
                  </div>
                </>
              ) : (
                <>
                  <Page page={current} side={sideOf(pos)} index={pos + 1} total={pages.length} />
                  <div className="cast cast-full" ref={castRef} aria-hidden />
                  <div className="leaf leaf-single" ref={leafRef} aria-hidden>
                    <div className="leaf-face front">
                      <PageGhost page={target} side="right" />
                    </div>
                    <div className="leaf-face back paper-back" />
                  </div>
                </>
              )
            ) : (
              <Page page={current} side={sideOf(pos)} index={pos + 1} total={pages.length} />
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
        <div className="leaf leaf-left" ref={leafRef} aria-hidden>
          <div className="leaf-face front">
            <PageGhost page={cur.left} side="left" />
          </div>
          <div className="leaf-face back">
            <PageGhost page={nxt.right} side="right" />
          </div>
        </div>
      );
    } else {
      rightShown = nxt.right;
      leaf = (
        <div className="leaf leaf-right" ref={leafRef} aria-hidden>
          <div className="leaf-face front">
            <PageGhost page={cur.right} side="right" />
          </div>
          <div className="leaf-face back">
            <PageGhost page={nxt.left} side="left" />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="book-stage">
      {header}
      <div className={`book ${flip ? 'turning' : ''}`} ref={bookRef} {...handlers} style={blockVars}>
        <div className="book-block">
          <div className="stack stack-left" aria-hidden />
          <div className="stack stack-right" aria-hidden />
          {/* DOM order: right page first for screen readers; the CSS grid places it on the right. */}
          <div className="spread">
            <Page page={rightShown} side="right" index={(flip?.dir === 'prev' ? flip.to : index) * 2 + 1} total={pages.length} />
            <Page page={leftShown} side="left" index={(flip?.dir === 'next' ? flip.to : index) * 2 + 2} total={pages.length} />
          </div>
          <div className="spine" aria-hidden />
          {flip && <div className={`cast ${flip.dir === 'next' ? 'cast-left' : 'cast-right'}`} ref={castRef} aria-hidden />}
          {leaf}
        </div>
      </div>
      {nav}
    </div>
  );
}
