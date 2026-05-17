'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const supabase = createClient();
    
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setStatus(`Error: ${errorDescription || error}`);
      setTimeout(() => router.push('/auth/login'), 3000);
      return;
    }

    const exchangeCodeForSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('Error: ' + error.message);
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      if (session) {
        setStatus('Success! Redirecting...');
        router.push('/');
        router.refresh();
      } else {
        setStatus('Session not found. Please try again.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    exchangeCodeForSession();
  }, [router, searchParams]);

  return (
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<LoadingFallback />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}