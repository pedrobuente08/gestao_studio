'use client';

import { useState } from 'react';
import { RouteGuard } from '@/components/auth/route-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-zinc-950">
        {/* Sidebar — fixo no desktop, oculto no mobile */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
          <Sidebar />
        </aside>

        {/* Conteúdo principal */}
        <div className="flex flex-col flex-1 lg:pl-64">
          <Header onMenuToggle={toggleSidebar} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Drawer mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeSidebar}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-72 shadow-2xl">
              <Sidebar onClose={closeSidebar} />
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
