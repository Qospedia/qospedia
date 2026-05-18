'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router.push('/');
          router.refresh();
        } else {
          setSuccess('Account created! Please check your email to verify, then sign in.');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const supabase = createClient();
      const siteUrl = 'https://qospedia.vercel.app';
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });
      
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google signup failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-[20px] font-semibold text-[#050505]">Create Account</CardTitle>
          <CardDescription className="text-[#636363]">Join Qospedia</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[14px] rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[#F0FDF4] border border-[#22C55E] text-[#22C55E] text-[14px] rounded-lg">
              {success}
            </div>
          )}
          
          <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogleSignup} disabled={googleLoading}>
            {googleLoading ? 'Connecting...' : 'Sign up with Google'}
          </Button>
          
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#E5E7EB]" /></div>
            <div className="relative flex justify-center text-[12px]"><span className="bg-[#FCFCFC] px-2 text-[#636363]">Or</span></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-[14px] font-medium text-[#050505]">Full Name</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email" className="text-[14px] font-medium text-[#050505]">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password" className="text-[14px] font-medium text-[#050505]">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" className="w-full bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]" disabled={loading}>
              {loading ? 'Creating...' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-[14px]">
            <span className="text-[#636363]">Already have an account? </span>
            <Link href="/auth/login" className="text-[#2563EB] hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}