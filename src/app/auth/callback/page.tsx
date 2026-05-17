'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const supabase = createClient();
    
    // Check for error in URL
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setStatus(`Error: ${errorDescription || error}`);
      setTimeout(() => router.push('/auth/login'), 3000);
      return;
    }

    // Exchange code for session
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}