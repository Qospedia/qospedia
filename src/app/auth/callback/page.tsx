'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session }, error }: any) => {
      if (error || !session) {
        setStatus('Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setStatus('Success! Redirecting...');
        router.push('/');
        router.refresh();
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}