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
import { UserMenu } from './user-menu';
import {
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles?: string[];
  tenantTypes?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['OWNER', 'STAFF'] },
  { href: '/sessions', label: 'Procedimentos', icon: ClipboardList, roles: ['OWNER', 'STAFF'] },
  { 
    href: '/performance', 
    label: 'Desempenho', 
    icon: TrendingUp,
    tenantTypes: ['STUDIO'],
    roles: ['OWNER', 'STAFF']
  },
  { 
    href: '/financial', 
    label: 'Financeiro', 
    icon: DollarSign,
    roles: ['OWNER', 'STAFF'] 
  },
  { 
    href: '/employees', 
    label: 'Equipe', 
    icon: ShieldCheck,
    tenantTypes: ['STUDIO'],
    roles: ['OWNER', 'STAFF']
  },
  { 
    href: '/service-types', 
    label: 'Tipos de Serviço', 
    icon: Settings,
    tenantTypes: ['STUDIO'],
    roles: ['OWNER', 'STAFF']
  },
  { href: '/calculator', label: 'Calculadora', icon: Calculator, roles: ['OWNER', 'STAFF'] },
  { href: '/budget-suggestion', label: 'Sugestão de Orçamento', icon: Lightbulb, roles: ['OWNER', 'STAFF'] },
  { href: '/settings', label: 'Configurações', icon: Settings, roles: ['OWNER'], tenantTypes: ['STUDIO'] },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800/50">
      {/* Logo + botão fechar (mobile) */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-zinc-800/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <span className="text-white font-black text-xl italic">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">InkStudio</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <ul className="space-y-1.5">
          {navItems
            .filter((item) => {
              if (item.roles && user?.role) {
                if (!(item.roles as any).includes(user.role)) return false;
              }
              if (item.tenantTypes && user?.tenantType) {
                if (!(item.tenantTypes as any).includes(user.tenantType)) return false;
              }
              return true;
            })
            .map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-rose-500/10 text-rose-500 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.15)]'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* User Menu / Logout */}
      <div className="p-4 border-t border-zinc-800/40 bg-zinc-950/50 backdrop-blur-sm">
        <UserMenu />
      </div>
    </div>
  );
}
