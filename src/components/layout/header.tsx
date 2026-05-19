'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User, Plus, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/recent', label: 'Recent' },
];

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggle} 
      className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)] hover:text-[#050505] dark:text-[#858585] dark:hover:bg-[rgba(252,252,252,0.1)] dark:hover:text-[#FCFCFC]"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      )}
    </Button>
  );
}

export function Navbar({ showSearch = true }: { showSearch?: boolean }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isHomepage = pathname === '/';

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDropdownOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-dropdown]')) {
          setIsDropdownOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 bg-[#FCFCFC] dark:bg-[#050505] border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
      <div className="container mx-auto flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className={cn(
            "font-semibold tracking-tight transition-all",
            isHomepage ? 'text-[28px]' : 'text-[20px]',
            "text-[#050505] dark:text-[#FCFCFC]"
          )} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Qospedia
          </Link>
          {!isHomepage && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    'text-[14px] font-medium transition-colors',
                    pathname === link.href ? 'text-[#2563EB]' : 'text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {!isHomepage && showSearch && (
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <SearchBar showVoice className="w-full" />
          </div>
        )}

        <div className="flex items-center gap-3">
          {isHomepage && showSearch && (
            <div className="hidden lg:block">
              <SearchBar showVoice className="w-80" />
            </div>
          )}
          
          {!isHomepage && (
            <Link href="/suggest">
              <Button variant="ghost" size="sm" className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)] hidden md:flex">
                Suggest
              </Button>
            </Link>
          )}

          <ThemeToggle />

          {user ? (
            <div className="relative" data-dropdown>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#1A1A1A] shadow-[rgba(0,0,0,0.25)_0px_25px_50px_-12px] z-[60]">
                  <div className="p-3 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                    <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">{profile?.full_name || user.email}</p>
                    <p className="text-[12px] text-[#858585] dark:text-[#636363] capitalize">{profile?.role}</p>
                  </div>
                  <div className="p-1">
                    {profile?.role === 'editor' || profile?.role === 'admin' ? (
                      <Link href="/editor/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsDropdownOpen(false)}>
                        <Plus className="h-4 w-4" />New Article
                      </Link>
                    ) : null}
                    <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsDropdownOpen(false)}>
                      <User className="h-4 w-4" />Profile
                    </Link>
                    {(profile?.role === 'editor' || profile?.role === 'admin') && (
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                    )}
                    {profile?.role === 'admin' && (
                      <Link href="/studio" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsDropdownOpen(false)}>
                        <Settings className="h-4 w-4" />Admin Studio
                      </Link>
                    )}
                    <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/'; }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]">
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]">Sign In</Button></Link>
              <Link href="/auth/signup"><Button size="sm" className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]">Sign Up</Button></Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#050505] p-4">
          <nav className="flex flex-col gap-4">
            <div className="w-full">
              <SearchBar showVoice autoFocus />
            </div>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-[14px] font-medium text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/suggest" className="text-[14px] font-medium text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]" onClick={() => setIsMenuOpen(false)}>
              Suggest
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}