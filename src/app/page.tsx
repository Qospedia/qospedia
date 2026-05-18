'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-[32px] font-semibold tracking-tight">Qospedia</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <header className="absolute top-0 left-0 right-0 flex justify-end p-4 gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
          >
            <Moon className="h-5 w-5 dark:hidden" />
            <Sun className="h-5 w-5 hidden dark:block" />
          </Button>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]">
              Sign Up
            </Button>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center space-y-8">
            <h1 
              className="text-[32px] font-semibold text-[#050505] dark:text-[#FCFCFC] tracking-tight" 
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Qospedia
            </h1>
            <form action="/search" className="relative max-w-xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#858585] dark:text-[#636363]" />
              <Input
                name="q"
                type="search"
                placeholder="Search for any topic..."
                className="w-full h-[48px] pl-14 pr-6 text-[16px] bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </main>

        <footer className="absolute bottom-0 right-0 p-4 flex items-center gap-6">
          <Link href="/terms" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">
            Privacy Policy
          </Link>
          <Link href="/about" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">
            About
          </Link>
          <Link href="/contact" className="text-[12px] text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]">
            Feedback
          </Link>
        </footer>
      </div>
    </div>
  );
}