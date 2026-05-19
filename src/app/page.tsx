'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, Plus, LayoutDashboard, Settings, Lightbulb } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const loadUserData = useCallback(async (currentUser: any) => {
    if (!currentUser) return;
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadUserData(data.session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserData(session.user);
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        router.refresh();
      }
    });

    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router, loadUserData]);

  const handleSuggest = async () => {
    if (!user) {
      router.push('/auth/login?next=/suggest');
      return;
    }
    router.push('/suggest');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col">
          <header className="absolute top-0 left-0 right-0 p-4">
            <div className="flex justify-end items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-[#636363] dark:text-[#858585]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505]">
                  Sign Up
                </Button>
              </Link>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-2xl text-center space-y-10">
              <h1 className="text-[56px] font-semibold text-[#050505] dark:text-[#FCFCFC] tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <header className="absolute top-0 left-0 right-0 p-4">
          <div className="flex justify-end items-center gap-2">
            {user ? (
              <div className="relative flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggest}
                  className="flex items-center gap-2 text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Suggest</span>
                </Button>
                <div className="relative">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  </Button>
                  
                  {isMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#1A1A1A] shadow-lg z-50">
                        <div className="p-3 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">{profile?.full_name || user.email}</p>
                          <p className="text-[12px] text-[#858585] dark:text-[#636363] capitalize">{profile?.role || 'user'}</p>
                        </div>
                        <div className="p-1">
                          {profile?.role === 'editor' || profile?.role === 'admin' ? (
                            <Link href="/editor/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsMenuOpen(false)}>
                              <Plus className="h-4 w-4" />New Article
                            </Link>
                          ) : null}
                          <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsMenuOpen(false)}>
                            <User className="h-4 w-4" />Profile
                          </Link>
                          {(profile?.role === 'editor' || profile?.role === 'admin') && (
                            <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsMenuOpen(false)}>
                              <LayoutDashboard className="h-4 w-4" />Dashboard
                            </Link>
                          )}
                          {profile?.role === 'admin' && (
                            <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#050505] dark:text-[#FCFCFC] hover:bg-[#F7F7F7] dark:hover:bg-[rgba(252,252,252,0.1)]" onClick={() => setIsMenuOpen(false)}>
                              <Settings className="h-4 w-4" />Admin
                            </Link>
                          )}
                          <button 
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
                          >
                            <LogOut className="h-4 w-4" />Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/suggest')}
                  className="flex items-center gap-2 text-[#636363] dark:text-[#858585] hover:bg-[rgba(5,5,5,0.05)] dark:hover:bg-[rgba(252,252,252,0.1)]"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Suggest</span>
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
              </>
            )}
          </div>
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