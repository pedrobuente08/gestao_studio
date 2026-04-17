'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tattoo-hub-theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  /** false no SSR / primeiro paint — evita ícone errado antes de ler localStorage */
  mounted: boolean;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'dark';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function applyDomClass(pref: ThemePreference) {
  const root = document.documentElement;
  let dark = true;
  if (pref === 'light') dark = false;
  else if (pref === 'system') {
    dark = !window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  if (dark) root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreferenceState(getStoredPreference());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDomClass(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [preference, mounted]);

  useEffect(() => {
    if (!mounted || preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyDomClass('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference, mounted]);

  const resolved: 'light' | 'dark' =
    !mounted
      ? 'dark'
      : preference === 'light'
        ? 'light'
        : preference === 'dark'
          ? 'dark'
          : typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    applyDomClass(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ThemePreference = prev === 'dark' ? 'light' : 'dark';
      applyDomClass(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, mounted, setPreference, toggle }),
    [preference, resolved, mounted, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
