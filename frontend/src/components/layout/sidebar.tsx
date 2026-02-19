'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  DollarSign,
  Calculator,
  Lightbulb,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/sessions', label: 'Procedimentos', icon: ClipboardList },
  { href: '/financial', label: 'Financeiro', icon: DollarSign },
  { href: '/calculator', label: 'Calculadora', icon: Calculator },
  { href: '/budget-suggestion', label: 'Sugestão de Orçamento', icon: Lightbulb },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Logo + botão fechar (mobile) */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800">
        <span className="text-xl font-bold text-rose-500">InkStudio</span>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors group"
        >
          <LogOut className="h-5 w-5 shrink-0 text-zinc-400 group-hover:text-rose-500 transition-colors" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
