import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Loader2, AlertCircle } from 'lucide-react';
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

  // First check for existing articles
  const { data: articles } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name), categories:categories(*)')
    .eq('status', 'published')
    .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},summary.ilike.${searchTerm}`)
    .order('view_count', { ascending: false })
    .limit(20);

  if (articles && articles.length > 0) {
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

  // No articles found - need to generate one
  console.log(`[Search] No articles for "${query}", generating...`);

  // Import the generate function dynamically to avoid build issues
  let generationError = '';
  let generationSuccess = false;
  let generatedArticle = null;

  try {
    const { autoGenerateArticles } = await import('@/lib/auto-generate');
    const result = await autoGenerateArticles(query);
    
    console.log('[Search] Generation result:', JSON.stringify(result));
    generationSuccess = result.success;

    if (result.generated > 0) {
      // Fetch the newly created article - try title first, then slug
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      let { data: newArticles } = await supabase
        .from('articles')
        .select('*, author:profiles(full_name)')
        .eq('status', 'published')
        .eq('slug', slug)
        .limit(1);

      if (!newArticles || newArticles.length === 0) {
        // Try title search as fallback
        const { data: titleArticles } = await supabase
          .from('articles')
          .select('*, author:profiles(full_name)')
          .eq('status', 'published')
          .ilike('title', searchTerm)
          .limit(1);
        newArticles = titleArticles;
      }

      // Last resort: get most recent article
      if (!newArticles || newArticles.length === 0) {
        const { data: recentArticles } = await supabase
          .from('articles')
          .select('*, author:profiles(full_name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1);
        newArticles = recentArticles;
      }

      if (newArticles && newArticles.length > 0) {
        generatedArticle = newArticles[0];
        console.log('[Search] Found generated article:', generatedArticle.title, generatedArticle.slug);
      } else {
        console.log('[Search] Article not found after generation!');
      }
    }
  } catch (err: any) {
    console.error('[Search] Generation error:', err);
    generationError = err.message || 'Failed to generate article';
  }

  // If we generated an article, show it
  if (generatedArticle) {
    return (
      <>
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">✓ New article automatically generated for "{query}"</p>
        </div>
        <Link href={`/article/${generatedArticle.slug}`}>
          <Card className="transition-all hover:shadow-md border-green-500">
            <CardContent className="p-6">
              <h2 className="font-serif text-xl font-semibold text-foreground">{generatedArticle.title}</h2>
              <p className="mt-3 text-muted-foreground line-clamp-3">{generatedArticle.summary || 'AI generated content...'}</p>
              <span className="inline-block mt-3 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">AI Generated</span>
            </CardContent>
          </Card>
        </Link>
      </>
    );
  }

  // Show error or fallback message
  return (
    <div className="text-center py-8">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-2">No articles found for "{query}"</p>
      {generationError && (
        <div className="flex items-center justify-center gap-2 text-destructive text-sm mb-4">
          <AlertCircle className="h-4 w-4" />
          <span>AI generation failed: {generationError}</span>
        </div>
      )}
      {generationSuccess && !generatedArticle && (
        <p className="text-sm text-amber-600 mb-2">
          Article was generated but couldn't be retrieved. Check database or try again.
        </p>
      )}
      {!generationSuccess && !generationError && (
        <p className="text-sm text-muted-foreground">
          Make sure GROQ_API_KEY is configured in your environment.
        </p>
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
            <p className="mt-4 text-muted-foreground">Enter a search term</p>
          </div>
        )}
      </div>
    </div>
  );
}