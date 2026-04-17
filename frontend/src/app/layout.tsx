import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var k = 'tattoo-hub-theme';
    var v = localStorage.getItem(k);
    var root = document.documentElement;
    if (v === 'light') { root.classList.remove('dark'); return; }
    if (v === 'dark') { root.classList.add('dark'); return; }
    if (v === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.classList.remove('dark');
      return;
    }
    root.classList.add('dark');
  } catch (e) { document.documentElement.classList.add('dark'); }
})();`;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tattoo Hub - Gestão para Tatuadores',
  description: 'Sistema de gestão para tatuadores e estúdios de tatuagem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface-primary text-content-primary min-h-screen`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
