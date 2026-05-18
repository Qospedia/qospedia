'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, createContext, useContext } from 'react';
import { Search, Menu, X, User, Plus, LogOut, Settings, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const ThemeContext = createContext({ isDark: false, toggle: () => {} });

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/recent', label: 'Recent' },
];

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  return useContext(ThemeContext);
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)] hover:text-[#050505]">
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

function Navbar() {
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
    <header className="sticky top-0 z-50 bg-[#FCFCFC] border-b border-[#E5E7EB]">
      <div className="container mx-auto flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[20px] font-semibold text-[#050505] tracking-tight">
            Qospedia
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  'text-[14px] font-medium transition-colors',
                  pathname === link.href ? 'text-[#2563EB]' : 'text-[#636363] hover:text-[#050505]'
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="w-64 pl-9 pr-4" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </form>

          <ThemeToggle />

          {user ? (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)]">
                <User className="h-5 w-5" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E7EB] bg-[#FCFCFC] shadow-[rgba(0,0,0,0.25)_0px_25px_50px_-12px]">
                  <div className="p-3 border-b border-[#E5E7EB]">
                    <p className="text-[14px] font-medium text-[#050505]">{profile?.full_name || user.email}</p>
                    <p className="text-[12px] text-[#858585]">{profile?.role}</p>
                  </div>
                  <div className="p-1">
                    {profile?.role === 'editor' || profile?.role === 'admin' ? (
                      <Link href="/editor/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] hover:bg-[#F7F7F7]">
                        <Plus className="h-4 w-4" />New Article
                      </Link>
                    ) : null}
                    <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] hover:bg-[#F7F7F7]">
                      <User className="h-4 w-4" />Profile
                    </Link>
                    {(profile?.role === 'editor' || profile?.role === 'admin') && (
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] hover:bg-[#F7F7F7]">
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                    )}
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] hover:bg-[#F7F7F7]">
                        <Settings className="h-4 w-4" />Admin
                      </Link>
                    )}
                    <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/'; }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[14px] hover:bg-[#F7F7F7] text-[#EF4444]">
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-[#636363]">Sign In</Button></Link>
              <Link href="/auth/signup"><Button size="sm" className="bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]">Sign Up</Button></Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden text-[#636363] hover:bg-[rgba(5,5,5,0.05)]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-[#FCFCFC] p-4">
          <nav className="flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
                <Input type="search" placeholder="Search..." className="w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </form>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-[14px] font-medium text-[#636363] hover:text-[#050505]" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export { Navbar, ThemeProvider, ThemeToggle, useTheme };