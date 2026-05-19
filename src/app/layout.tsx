import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Footer } from '@/components/layout/footer';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';
import { NavbarWrapper } from '@/components/layout/navbar-wrapper';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

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
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
              (function(){var s=document.createElement('script');s.async=1;s.src='https://widget.intercom.io/widget/'+(window.INTERCOM_APP_ID||'');document.head.appendChild(s);})();
            `,
          }}
        />
      </head>
      <body className={`${playfair.variable} min-h-screen flex flex-col bg-[#FCFCFC] dark:bg-[#050505] text-[#050505] dark:text-[#FCFCFC]`}>
        <Providers>
          <NavbarWrapper />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastProvider />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}