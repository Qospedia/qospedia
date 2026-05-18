'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      setError(errorDescription || errorParam);
      setStatus('Authentication failed. Redirecting...');
      setTimeout(() => router.push('/auth/login'), 3000);
      return;
    }

    const exchangeCodeForSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setStatus('Error getting session. Redirecting...');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        if (session) {
          setStatus('Success! Redirecting...');
          router.push('/');
          router.refresh();
        } else {
          const code = searchParams.get('code');
          if (code) {
            setStatus('Exchanging code for session...');
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('Code exchange error:', exchangeError);
              setError(exchangeError.message);
              setStatus('Error exchanging code. Redirecting...');
              setTimeout(() => router.push('/auth/login'), 3000);
            } else if (sessionData?.session) {
              router.push('/');
              router.refresh();
            }
          } else {
            setError('No authentication code found');
            setStatus('No code found. Redirecting...');
            setTimeout(() => router.push('/auth/login'), 3000);
          }
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'An unexpected error occurred');
        setStatus('Error occurred. Redirecting...');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    exchangeCodeForSession();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-[16px] text-[#636363] dark:text-[#858585]">{status}</p>
        {error && (
          <p className="text-[14px] text-[#EF4444]">Error: {error}</p>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-[16px] text-[#636363] dark:text-[#858585]">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}