'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { resolved, toggle, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-xl border border-edge bg-surface-card"
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl border border-edge bg-surface-card p-2 text-content-secondary transition-colors hover:bg-surface-elevated hover:text-content-primary"
      title={resolved === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      aria-label={resolved === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
