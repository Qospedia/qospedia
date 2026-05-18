'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <Card className="w-full max-w-md border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
        <CardHeader className="text-center">
          <CardTitle className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Reset Password</CardTitle>
          <CardDescription className="text-[#636363] dark:text-[#858585]">
            {sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] text-[14px] rounded-lg">
              {error}
            </div>
          )}
          
          {sent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.1)] rounded-lg">
                <p className="text-[14px] text-[#22C55E]">
                  We sent a password reset link to {email}
                </p>
              </div>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
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
              <Button type="submit" className="w-full bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-[14px]">
            <span className="text-[#636363] dark:text-[#858585]">Remember your password? </span>
            <Link href="/auth/login" className="text-[#2563EB] hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}