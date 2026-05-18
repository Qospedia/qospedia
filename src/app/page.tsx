'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';

export default function HomePage() {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <header className="absolute top-0 left-0 right-0 flex justify-end p-4 gap-2">
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
          <div className="w-full max-w-2xl text-center space-y-10">
            <h1 
              className="text-[56px] font-semibold text-[#050505] dark:text-[#FCFCFC] tracking-tight" 
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Qospedia
            </h1>
            <div className="max-w-xl mx-auto">
              <SearchBar showVoice autoFocus />
            </div>
            <p className="text-[16px] text-[#636363] dark:text-[#858585]">
              Your knowledge base, powered by AI
            </p>
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