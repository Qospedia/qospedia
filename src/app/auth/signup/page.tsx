'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
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
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: 'user'
        });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
        
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <Card className="w-full max-w-md border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
        <CardHeader className="text-center">
          <CardTitle className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Create Account</CardTitle>
          <CardDescription className="text-[#636363] dark:text-[#858585]">Join Qospedia</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] text-[14px] rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.1)] border border-[#22C55E] text-[#22C55E] text-[14px] rounded-lg">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                className="mt-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]" 
              />
            </div>
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
                minLength={6} 
                className="mt-1 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]" 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-[14px]">
            <span className="text-[#636363] dark:text-[#858585]">Already have an account? </span>
            <Link href="/auth/login" className="text-[#2563EB] hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}