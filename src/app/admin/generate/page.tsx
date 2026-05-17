'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const res = await fetch('/api/generate-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'qospedia-admin-2024' }),
      });
      
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setResults({ error: err.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Generate Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              This will automatically generate encyclopedia articles using AI. 
              It will research topics from Wikipedia and Tavily, then create articles using Groq AI.
            </p>
            
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full"
              variant="accent"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Articles...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Articles
                </>
              )}
            </Button>

            {results && (
              <div className="mt-6 p-4 bg-secondary rounded-lg">
                {results.error ? (
                  <p className="text-destructive">Error: {results.error}</p>
                ) : (
                  <>
                    <p className="font-medium">Generation Complete!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated: {results.generated} articles
                      {results.failed > 0 && ` | Failed: ${results.failed}`}
                    </p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground">View details</summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40">
                        {JSON.stringify(results.results, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}