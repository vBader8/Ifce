import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

/** Tiny hash router – works from file:// (standalone build) and any static host. */
export function currentPath(): string {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  const p = h.replace(/^#/, '');
  return p.startsWith('/') ? p : '/';
}

export function navigate(to: string) {
  if (currentPath() === to) return;
  window.location.hash = to;
}

export function useRoute(): { path: string; parts: string[]; query: URLSearchParams } {
  const [path, setPath] = useState(currentPath());
  useEffect(() => {
    const on = () => setPath(currentPath());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const [pure, qs] = path.split('?');
  return { path: pure, parts: pure.split('/').filter(Boolean), query: new URLSearchParams(qs ?? '') };
}

export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
