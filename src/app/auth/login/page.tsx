'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://qospedia.vercel.app';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast({ 
          title: 'Email Not Verified', 
          description: 'Please check your email and click the verification link.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${SITE_URL}/auth/callback`,
      },
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email first', variant: 'destructive' });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
    });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Verification email resent!' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Qospedia account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-center text-muted-foreground mb-3">Didn't receive verification email?</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleResendVerification} className="w-full">Resend Verification</Button>
          </div>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-accent hover:underline">Sign up</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}