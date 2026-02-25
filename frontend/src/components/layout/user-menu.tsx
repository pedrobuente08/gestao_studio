'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { LogOut, User as UserIcon, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ProfileModal } from '@/components/profile/profile-modal';

export function UserMenu() {
  const { user, logout, isLogoutLoading } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [profileTab, setProfileTab] = React.useState<'profile' | 'password'>('profile');

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const openProfile = (tab: 'profile' | 'password') => {
    setProfileTab(tab);
    setIsOpen(true);
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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all group outline-none">
            <Avatar.Root className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-500/10 border border-rose-500/20">
              <Avatar.Image
                src={user.profilePhotoUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
              <Avatar.Fallback className="text-sm font-bold text-rose-500">
                {initials}
              </Avatar.Fallback>
            </Avatar.Root>

            <div className="flex flex-1 flex-col items-start overflow-hidden">
              <span className="truncate w-full text-zinc-200">{user.name}</span>
              <span className="truncate w-full text-xs text-zinc-500 capitalize">
                {user.role.toLowerCase()}
              </span>
            </div>

            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            sideOffset={5}
            align="end"
          >
            <div className="px-2 py-2 mb-1">
              <p className="text-xs font-medium text-zinc-500 px-1">Minha Conta</p>
            </div>

            <DropdownMenu.Item
              onClick={() => openProfile('profile')}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 outline-none hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
            >
              <UserIcon className="h-4 w-4 shrink-0 transition-colors" />
              Meu Perfil
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => openProfile('password')}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 outline-none hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
            >
              <Lock className="h-4 w-4 shrink-0 transition-colors" />
              Trocar Senha
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1.5 h-px bg-zinc-800" />

            <DropdownMenu.Item
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-rose-500 outline-none hover:bg-rose-500/10 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0 transition-colors" />
              Sair do Sistema
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ProfileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab={profileTab}
      />
    </>
  );
}
