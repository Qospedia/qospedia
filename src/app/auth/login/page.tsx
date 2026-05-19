'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        window.location.href = '/';
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
    
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (!profileData) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || '',
            role: 'user'
          });
        }
        
        const nextUrl = new URLSearchParams(window.location.search).get('next');
        window.location.href = nextUrl || '/';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <Card className="w-full max-w-md border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
        <CardHeader className="text-center">
          <CardTitle className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Welcome Back</CardTitle>
          <CardDescription className="text-[#636363] dark:text-[#858585]">Sign in to Qospedia</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] text-[14px] rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="mt-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]" 
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="mt-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]"
              />
            </div>
            <Button type="submit" className="w-full bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-[14px]">
            <span className="text-[#636363] dark:text-[#858585]">Forgot your password? </span>
            <Link href="/auth/reset-password" className="text-[#2563EB] hover:underline">Reset it</Link>
          </div>
          
          <div className="mt-4 text-center text-[14px]">
            <span className="text-[#636363] dark:text-[#858585]">Don't have an account? </span>
            <Link href="/auth/signup" className="text-[#2563EB] hover:underline">Sign up</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}