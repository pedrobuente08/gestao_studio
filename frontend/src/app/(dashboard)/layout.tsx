'use client';

import { RouteGuard } from '@/components/auth/route-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-zinc-950">
        {children}
      </div>
    </RouteGuard>
  );
}
