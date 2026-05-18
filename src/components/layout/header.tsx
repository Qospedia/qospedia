'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Menu, X, User, Plus, LogOut, Settings, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FCFCFC] dark:bg-[#050505] border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
      <div className="container mx-auto flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC] tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Qospedia
          </Link>
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
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585] dark:text-[#636363]" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="w-64 pl-9 pr-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363]" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </form>

          <ThemeToggle />

          {user ? (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]">
                <User className="h-5 w-5" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#1A1A1A] shadow-[rgba(0,0,0,0.25)_0px_25px_50px_-12px]">
                  <div className="p-3 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                    <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">{profile?.full_name || user.email}</p>
                    <p className="text-[12px] text-[#858585] dark:text-[#636363]">{profile?.role}</p>
                  </div>
                  <div className="p-1">
                    {profile?.role === 'editor' || profile?.role === 'admin' ? (
                      <Link href="/editor/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]">
                        <Plus className="h-4 w-4" />New Article
                      </Link>
                    ) : null}
                    <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]">
                      <User className="h-4 w-4" />Profile
                    </Link>
                    {(profile?.role === 'editor' || profile?.role === 'admin') && (
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]">
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                    )}
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]">
                        <Settings className="h-4 w-4" />Admin
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
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585] dark:text-[#636363]" />
                <Input type="search" placeholder="Search..." className="w-full pl-9 bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </form>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-[14px] font-medium text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}