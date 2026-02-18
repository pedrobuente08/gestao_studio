'use client';

import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {/* Botão hamburger — apenas mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-4 p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo — apenas mobile */}
        <span className="lg:hidden text-rose-500 font-bold text-lg">InkStudio</span>

        {/* Espaço flexível */}
        <div className="flex-1" />

        {/* Avatar e nome do usuário */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-zinc-100 leading-tight">{user?.name}</p>
            <p className="text-xs text-zinc-400 capitalize leading-tight">
              {user?.role?.toLowerCase() || 'usuário'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-rose-500">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
