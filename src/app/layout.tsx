import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/layout/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qospedia - Your Knowledge Platform',
  description: 'A modern encyclopedia with AI-powered features. Discover, learn, and contribute knowledge.',
  keywords: ['encyclopedia', 'knowledge', 'ai', 'articles', 'learning'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Qospedia - Your Knowledge Platform',
    description: 'A modern encyclopedia with AI-powered features.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Qospedia',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[#FCFCFC] text-[#050505]">
        <Providers>
          <ThemeProvider>
            <main className="flex-1">{children}</main>
            <Footer />
            <ToastProvider />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}