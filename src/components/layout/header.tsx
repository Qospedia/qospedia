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

function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();

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
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-primary/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Qospedia</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn('text-sm font-medium text-white/90 hover:text-white transition-colors', pathname === link.href && 'text-white')}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input type="search" placeholder="Search..." className="w-64 pl-9 pr-4 bg-white/10 border-white/20 text-white placeholder:text-white/60" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </form>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white hover:bg-white/10">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white hover:bg-white/10">
                <User className="h-5 w-5" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{profile?.role}</p>
                  </div>
                  <div className="p-1">
                    {profile?.role === 'editor' || profile?.role === 'admin' ? (
                      <Link href="/editor/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                        <Plus className="h-4 w-4" />New Article
                      </Link>
                    ) : null}
                    <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                      <User className="h-4 w-4" />Profile
                    </Link>
                    {(profile?.role === 'editor' || profile?.role === 'admin') && (
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                    )}
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                        <Settings className="h-4 w-4" />Admin
                      </Link>
                    )}
                    <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/'; }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary text-destructive">
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Sign In</Button></Link>
              <Link href="/auth/signup"><Button size="sm" className="bg-accent text-white hover:bg-accent/90">Sign Up</Button></Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary p-4">
          <nav className="flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input type="search" placeholder="Search..." className="w-full pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </form>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-white/90 hover:text-white" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export { Navbar, ThemeProvider };