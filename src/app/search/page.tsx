import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateExcerpt } from '@/lib/utils';
import { autoGenerateArticles } from '@/lib/auto-generate';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return { title: params.q ? `Search: ${params.q} - Qospedia` : 'Search - Qospedia' };
}

async function SearchResults({ query }: { query: string }) {
  const supabase = await createClient();

  let articles: any[] = [];
  let totalCount = 0;

  if (query.trim()) {
    const { data, count } = await supabase
      .from('articles')
      .select('*, author:profiles(full_name), categories:categories(*)', { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(20);

    articles = data || [];
    totalCount = count || 0;
  }

  // If no articles found, generate one automatically
  if (articles.length === 0 && query.trim()) {
    console.log(`[Search] No articles found for "${query}", generating...`);
    const result = await autoGenerateArticles(1);
    
    if (result.generated > 0) {
      // Fetch the newly created article
      const { data: newArticles } = await supabase
        .from('articles')
        .select('*, author:profiles(full_name), categories:categories(*)')
        .eq('status', 'published')
        .ilike('title', `%${query}%`)
        .limit(1);
      
      if (newArticles && newArticles.length > 0) {
        articles = newArticles;
        totalCount = 1;
      }
    }
  }

  if (articles.length > 0) {
    return (
      <>
        <div className="mb-6 text-muted-foreground">
          {totalCount === 1 && query.trim() ? (
            <span>Found 1 article for "{query}" (AI-generated)</span>
          ) : (
            <span>Found {totalCount} result{totalCount === 1 ? '' : 's'} for "{query}"</span>
          )}
        </div>
        <div className="space-y-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-serif text-xl font-semibold text-foreground">{article.title}</h2>
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">AI Generated</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {article.categories?.slice(0, 2).map((cat: any) => (
                          <span key={cat.id} className="bg-secondary px-2 py-0.5 rounded text-xs">{cat.name}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-muted-foreground line-clamp-2">{article.summary || generateExcerpt(article.content)}</p>
                    </div>
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="text-center py-8">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">No articles found for "{query}"</p>
      <p className="text-sm text-muted-foreground">Try searching for something else or visit our categories.</p>
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
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/categories"><Button variant="outline">Browse Categories</Button></Link>
              <Link href="/recent"><Button variant="outline">Recent Articles</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}