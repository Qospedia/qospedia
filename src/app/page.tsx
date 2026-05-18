'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <header className="absolute top-0 left-0 right-0 flex justify-end p-4 gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)] hover:text-[#050505] dark:text-[#858585] dark:hover:bg-[rgba(252,252,252,0.1)] dark:hover:text-[#FCFCFC]"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)] hover:text-[#050505] dark:text-[#858585] dark:hover:bg-[rgba(252,252,252,0.1)]">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a] dark:bg-[#FCFCFC] dark:text-[#050505] dark:hover:bg-[#E5E7EB]">
              Sign Up
            </Button>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center space-y-8">
            <h1 className="text-[32px] font-semibold text-[#050505] tracking-tight dark:text-[#FCFCFC]">
              Qospedia
            </h1>
            <form action="/search" className="relative max-w-xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#858585] dark:text-[#636363]" />
              <Input
                name="q"
                type="search"
                placeholder="Search for any topic..."
                className="w-full h-[48px] pl-14 pr-6 text-[16px] dark:bg-[#1A1A1A] dark:text-[#FCFCFC] dark:border-[rgba(252,252,252,0.1)] dark:placeholder:text-[#636363]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </main>

        <footer className="absolute bottom-0 right-0 p-4 flex items-center gap-6">
          <Link href="/terms" className="text-[12px] text-[#858585] hover:text-[#050505] dark:text-[#636363] dark:hover:text-[#FCFCFC]">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[12px] text-[#858585] hover:text-[#050505] dark:text-[#636363] dark:hover:text-[#FCFCFC]">
            Privacy Policy
          </Link>
          <Link href="/about" className="text-[12px] text-[#858585] hover:text-[#050505] dark:text-[#636363] dark:hover:text-[#FCFCFC]">
            About
          </Link>
          <Link href="/contact" className="text-[12px] text-[#858585] hover:text-[#050505] dark:text-[#636363] dark:hover:text-[#FCFCFC]">
            Feedback
          </Link>
        </footer>
      </div>
    </div>
  );
}