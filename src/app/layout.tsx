import type { Metadata } from 'next';
import { Playfair_Display, Source_Serif_4 } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Qospedia - Your Knowledge Platform',
  description: 'A modern encyclopedia with AI-powered features. Discover, learn, and contribute knowledge.',
  keywords: ['encyclopedia', 'knowledge', 'ai', 'articles', 'learning'],
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
      <body className={`${playfair.variable} ${sourceSerif.variable} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}