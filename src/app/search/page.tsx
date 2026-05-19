import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react';
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

  let articles: any[] = [];
  let searchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, summary, content, view_count, created_at, published_at')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},summary.ilike.${searchTerm}`)
      .order('view_count', { ascending: false })
      .limit(20);

    if (error) {
      console.log('[Search] Query error:', error.message);
      searchError = error.message;
    } else {
      articles = data || [];
    }
  } catch (e: any) {
    console.log('[Search] Query exception:', e.message);
    searchError = e.message;
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
                    <h2 className="text-[16px] font-semibold text-[#050505]">{article.title}</h2>
                    <p className="mt-3 text-[#636363] line-clamp-2 text-[14px]">{article.summary || generateExcerpt(article.content)}</p>
                  </div>
                  <FileText className="h-5 w-5 text-[#858585]" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  console.log(`[Search] No articles found for "${query}", attempting to generate...`);
  return <GeneratingArticle query={query} initialError={searchError} />;
}

async function GeneratingArticle({ query, initialError }: { query: string; initialError: string | null }) {
  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  let generationResult: { success: boolean; generated: number; error?: string } = { success: false, generated: 0 };

  try {
    const { autoGenerateArticles } = await import('@/lib/auto-generate');
    generationResult = await autoGenerateArticles(query);
    console.log('[Search] Generation result:', JSON.stringify(generationResult));
  } catch (err: any) {
    console.error('[Search] Generation error:', err);
    generationResult = { success: false, generated: 0, error: err.message || 'Failed to generate article' };
  }

  if (generationResult.success && generationResult.generated > 0) {
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    let { data: newArticle } = await supabase
      .from('articles')
      .select('id, title, slug, summary, content')
      .eq('status', 'published')
      .eq('slug', slug)
      .limit(1);

    if (!newArticle || newArticle.length === 0) {
      const { data: titleArticles } = await supabase
        .from('articles')
        .select('id, title, slug, summary, content')
        .eq('status', 'published')
        .ilike('title', searchTerm)
        .limit(1);
      newArticle = titleArticles;
    }

    if (!newArticle || newArticle.length === 0) {
      const { data: recentArticles } = await supabase
        .from('articles')
        .select('id, title, slug, summary, content')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1);
      newArticle = recentArticles;
    }

    if (newArticle && newArticle.length > 0) {
      return (
        <>
          <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#22C55E] rounded-lg">
            <p className="text-[#22C55E] font-medium text-[14px]">✓ New article created for "{query}"</p>
          </div>
          <Link href={`/article/${newArticle[0].slug}`}>
            <Card className="transition-all hover:shadow-md border-[#22C55E] max-w-xl mx-auto">
              <CardContent className="p-6">
                <h2 className="text-[16px] font-semibold text-[#050505]">{newArticle[0].title}</h2>
                <p className="mt-3 text-[#636363] line-clamp-3 text-[14px]">{newArticle[0].summary || 'AI generated content...'}</p>
                <span className="inline-block mt-3 text-[12px] bg-[#F0FDF4] text-[#22C55E] px-2 py-0.5 rounded">AI Generated</span>
              </CardContent>
            </Card>
          </Link>
        </>
      );
    }
  }

  const displayError = generationResult.error || initialError;

  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <Sparkles className="h-10 w-10 text-[#2563EB]" />
        </div>
        <p className="text-[16px] text-[#636363]">
          Generating article for "{query}"...
        </p>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
          <span className="text-[14px] text-[#858585]">Powered by Groq AI</span>
        </div>
      </div>
      
{displayError && (
          <div className="mt-6 p-4 bg-[#FEF2F2] border border-[#EF4444] rounded-lg max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-[#EF4444] mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-[14px]">Generation Issue</span>
            </div>
            <p className="text-[14px] text-[#EF4444]">{displayError}</p>
            {displayError?.includes('GROQ') && (
              <p className="text-[12px] text-[#EF4444] opacity-70 mt-2">
                The AI service is temporarily unavailable. Please try again in a few minutes.
              </p>
            )}
          </div>
        )}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-[20px] font-semibold text-[#050505] mb-8">Search Articles</h1>

        <form action="/search" className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#858585]" />
              <Input name="q" type="search" placeholder="Search for articles..." defaultValue={query} className="h-[48px] pl-14 pr-6" />
            </div>
            <Button type="submit" size="lg" className="bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]">Search</Button>
          </div>
        </form>

        {query ? (
          <Suspense fallback={
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
              <p className="text-[#636363] mt-4 text-[14px]">Searching...</p>
            </div>
          }>
            <SearchResults query={query} />
          </Suspense>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-10 w-10 text-[#858585]" />
            <p className="mt-4 text-[#636363] text-[14px]">Enter a search term to find or create articles</p>
          </div>
        )}
      </div>
    </div>
  );
}