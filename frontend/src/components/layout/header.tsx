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
    <header className="sticky top-0 z-40 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-20 items-center px-6">
        {/* Botão hamburger — apenas mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo — apenas mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
            <span className="text-white font-black text-sm italic">I</span>
          </div>
          <span className="text-white font-bold tracking-tight">InkStudio</span>
        </div>

        {/* Espaço flexível */}
        <div className="flex-1" />

        {/* Avatar e nome do usuário */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-zinc-100 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
              {user?.role?.toLowerCase() || 'usuário'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-lg group hover:border-rose-500/50 transition-colors cursor-pointer">
            <span className="text-sm font-bold text-rose-500">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
