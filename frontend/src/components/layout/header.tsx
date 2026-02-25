'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Menu, User as UserIcon, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ProfileModal } from '@/components/profile/profile-modal';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout, isLogoutLoading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'password'>('profile');

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const openProfile = (tab: 'profile' | 'password') => {
    setProfileTab(tab);
    setIsProfileOpen(true);
  };

  return (
    <>
    {isLogoutLoading && (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950">
        <svg className="h-10 w-10 text-rose-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm text-zinc-400">Saindo...</p>
      </div>
    )}
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

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-lg hover:border-rose-500/50 transition-colors cursor-pointer outline-none"
                title="Minha conta"
              >
                <span className="text-sm font-bold text-rose-500">{initials}</span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
                sideOffset={8}
                align="end"
              >
                <div className="px-2 py-2 mb-1">
                  <p className="text-xs font-medium text-zinc-500 px-1">Minha Conta</p>
                </div>

                <DropdownMenu.Item
                  onClick={() => openProfile('profile')}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 outline-none hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  Meu Perfil
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => openProfile('password')}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 outline-none hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  Trocar Senha
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1.5 h-px bg-zinc-800" />

                <DropdownMenu.Item
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-rose-500 outline-none hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sair do Sistema
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialTab={profileTab}
      />
    </header>
    </>
  );
}
