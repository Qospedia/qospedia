'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'loading' | 'checking' | 'generating' | 'done' | 'error'>('loading');
  const [articleCount, setArticleCount] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAndGenerate();
  }, []);

  const checkAndGenerate = async () => {
    setStatus('checking');
    const supabase = createClient();

    const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
    setArticleCount(count || 0);

    if ((count || 0) >= 5) {
      setStatus('done');
      return;
    }

    setStatus('generating');
    
    try {
      const res = await fetch('/api/generate-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'qospedia-admin-2024' }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setStatus('error');
      } else {
        setGenerated(data.generated || 0);
        setStatus('done');
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#FCFCFC]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-[16px] font-semibold text-[#050505]">
            <Sparkles className="h-5 w-5 text-[#2563EB]" />
            Setting up Qospedia
          </CardTitle>
          <CardDescription className="text-[14px] text-[#636363]">Generating encyclopedia articles with AI</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
              <p className="mt-4 text-[14px] text-[#636363]">Loading...</p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
              <p className="mt-4 text-[14px] text-[#636363]">Checking database...</p>
              <p className="text-[12px] text-[#858585]">Current articles: {articleCount}</p>
            </div>
          )}

          {status === 'generating' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
              <p className="mt-4 text-[14px] text-[#636363]">Generating articles with AI...</p>
              <p className="text-[12px] text-[#858585]">This may take a few minutes</p>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-[#22C55E]" />
              <p className="mt-4 text-[16px] font-medium text-[#050505]">Setup Complete!</p>
              <p className="text-[14px] text-[#636363]">
                {articleCount > 0 
                  ? `You have ${articleCount} articles ready` 
                  : 'No articles generated - check API keys'}
              </p>
              <Button className="mt-6 bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]" onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-[#EF4444]" />
              <p className="mt-4 text-[16px] font-medium text-[#EF4444]">Setup Failed</p>
              <p className="text-[14px] text-[#636363]">{error}</p>
              <Button className="mt-6 bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]" onClick={checkAndGenerate}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}