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

    // Check current article count
    const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
    setArticleCount(count || 0);

    if ((count || 0) >= 5) {
      setStatus('done');
      return;
    }

    // Need to generate more articles
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Setting up Qospedia
          </CardTitle>
          <CardDescription>Generating encyclopedia articles with AI</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="mt-4 text-muted-foreground">Checking database...</p>
              <p className="text-sm text-muted-foreground">Current articles: {articleCount}</p>
            </div>
          )}

          {status === 'generating' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="mt-4 text-muted-foreground">Generating articles with AI...</p>
              <p className="text-sm text-muted-foreground">This may take a few minutes</p>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="mt-4 font-medium">Setup Complete!</p>
              <p className="text-sm text-muted-foreground">
                {articleCount > 0 
                  ? `You have ${articleCount} articles ready` 
                  : 'No articles generated - check API keys'}
              </p>
              <Button className="mt-6" onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="mt-4 font-medium text-destructive">Setup Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button className="mt-6" variant="outline" onClick={checkAndGenerate}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}