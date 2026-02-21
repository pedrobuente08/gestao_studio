'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Cookie já foi setado pelo Better Auth. Só buscar o user com campos customizados.
    authService.getMe()
      .then(user => {
        setUser(user);
        if (user.status === 'PENDING_SETUP') {
          router.replace('/complete-registration');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-sm text-zinc-400">Finalizando login com Google...</p>
      </div>
    </div>
  );
}
