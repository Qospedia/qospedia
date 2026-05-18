import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Loader2, AlertCircle, Sparkles, Database, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { generateExcerpt } from '@/lib/utils';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return { title: params.q ? `Search: ${params.q} - Qospedia` : 'Search - Qospedia' };
}

async function SearchResults({ query }: { query: string }) {
  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  let dbReady = false;
  let articles: any[] = [];

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:profiles(full_name), categories:categories(*)')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},summary.ilike.${searchTerm}`)
      .order('view_count', { ascending: false })
      .limit(20);

    if (!error && data) {
      dbReady = true;
      articles = data;
    }
  } catch {
    dbReady = false;
  }

  if (!dbReady) {
    return (
      <div className="text-center py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 text-amber-700 mb-4">
            <Database className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Database Setup Required</h2>
          </div>
          <p className="text-amber-700 mb-4">
            The database schema hasn't been set up yet. You need to run the SQL schema before articles can be created.
          </p>
          <div className="bg-white/50 rounded-lg p-4 text-left space-y-2">
            <p className="font-medium text-sm">Quick Setup:</p>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" className="underline">Supabase Dashboard</a></li>
              <li>Select your project</li>
              <li>Click <strong>SQL Editor</strong> in the sidebar</li>
              <li>Copy & paste the contents of <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code></li>
              <li>Click <strong>Run</strong> to execute</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length > 0) {
    return (
      <div className="space-y-4">
        {articles.map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`}>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="font-serif text-xl font-semibold text-foreground">{article.title}</h2>
                    <p className="mt-3 text-muted-foreground line-clamp-2">{article.summary || generateExcerpt(article.content)}</p>
                  </div>
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  console.log(`[Search] No articles for "${query}", generating...`);
  return <GeneratingArticle query={query} />;
}

async function GeneratingArticle({ query }: { query: string }) {
  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  let generationResult: { success: boolean; generated: number; error?: string } = { success: false, generated: 0 };

  try {
    const { autoGenerateArticles } = await import('@/lib/auto-generate');
    generationResult = await autoGenerateArticles(query);
    console.log('[Search] Generation result:', JSON.stringify(generationResult));
  } catch (err: any) {
    console.error('[Search] Generation error:', err);
    generationResult = { success: false, generated: 0, error: err.message || 'Failed to generate' };
  }

  if (generationResult.success && generationResult.generated > 0) {
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    let { data: newArticle } = await supabase
      .from('articles')
      .select('*, author:profiles(full_name)')
      .eq('status', 'published')
      .eq('slug', slug)
      .limit(1);

    if (!newArticle || newArticle.length === 0) {
      const { data: titleArticles } = await supabase
        .from('articles')
        .select('*, author:profiles(full_name)')
        .eq('status', 'published')
        .ilike('title', searchTerm)
        .limit(1);
      newArticle = titleArticles;
    }

    if (!newArticle || newArticle.length === 0) {
      const { data: recentArticles } = await supabase
        .from('articles')
        .select('*, author:profiles(full_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1);
      newArticle = recentArticles;
    }

    if (newArticle && newArticle.length > 0) {
      return (
        <>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✓ New article created for "{query}"</p>
          </div>
          <Link href={`/article/${newArticle[0].slug}`}>
            <Card className="transition-all hover:shadow-md border-green-500 max-w-xl mx-auto">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground">{newArticle[0].title}</h2>
                <p className="mt-3 text-muted-foreground line-clamp-3">{newArticle[0].summary || 'AI generated content...'}</p>
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">AI Generated</span>
              </CardContent>
            </Card>
          </Link>
        </>
      );
    }
  }

  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <Sparkles className="h-12 w-12 text-accent" />
        </div>
        <p className="text-lg text-muted-foreground">
          Generating article for "{query}"...
        </p>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Powered by Groq AI</span>
        </div>
      </div>
      
      {generationResult.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Generation Failed</span>
          </div>
          <p className="text-sm text-red-600">{generationResult.error}</p>
        </div>
      )}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Search Articles</h1>

        <form action="/search" className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" type="search" placeholder="Search for articles..." defaultValue={query} className="h-12 pl-11 pr-4" />
            </div>
            <Button type="submit" size="lg" variant="accent">Search</Button>
          </div>
        </form>

        {query ? (
          <Suspense fallback={
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          }>
            <SearchResults query={query} />
          </Suspense>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Enter a search term to find or create articles</p>
          </div>
        )}
      </div>
    </div>
  );
}