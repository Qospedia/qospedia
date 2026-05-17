import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateExcerpt, slugify } from '@/lib/utils';
import { generateArticleFromSearch } from '@/lib/article-generator';
import { toast } from '@/components/ui/use-toast';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; generate?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return {
    title: params.q ? `Search: ${params.q} - Qospedia` : 'Search - Qospedia',
  };
}

async function SearchResults({ query, generate }: { query: string; generate?: string }) {
  const supabase = await createClient();

  // Handle article generation request
  if (generate === 'true' && query) {
    try {
      const result = await generateArticleFromSearch(query);
      if (result) {
        toast({ title: 'Article Generated!', description: 'Redirecting to the new article...' });
        return (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
            <p className="text-muted-foreground">Generating article about "{query}"...</p>
          </div>
        );
      }
    } catch (error) {
      console.error('Generation error:', error);
    }
  }

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

  // Show results or generate option
  if (articles.length > 0) {
    return (
      <>
        <div className="mb-6 text-muted-foreground">
          Found {totalCount} result{totalCount === 1 ? '' : 's'} for "{query}"
        </div>
        <div className="space-y-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="font-serif text-xl font-semibold text-foreground">
                        {article.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {article.categories?.slice(0, 2).map((cat: any) => (
                          <span key={cat.id} className="bg-secondary px-2 py-0.5 rounded text-xs">
                            {cat.name}
                          </span>
                        ))}
                        {article.author?.full_name && (
                          <span>by {article.author.full_name}</span>
                        )}
                      </div>
                      <p className="mt-3 text-muted-foreground line-clamp-2">
                        {article.summary || generateExcerpt(article.content)}
                      </p>
                    </div>
                    <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  // No results - show generate option
  return (
    <div className="text-center py-8">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">No articles found for "{query}"</p>
      
      <Card className="max-w-md mx-auto mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Create This Article
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't find any articles matching your search. Would you like us to generate a comprehensive article using AI and web sources?
          </p>
          <form action={`/search?q=${encodeURIComponent(query)}&generate=true`} method="GET">
            <input type="hidden" name="q" value={query} />
            <Button type="submit" variant="accent" className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Article
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Powered by AI with sources from Wikipedia and web research
          </p>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Link href="/categories">
          <Button variant="outline">Browse Categories</Button>
        </Link>
      </div>
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
              <Input
                name="q"
                type="search"
                placeholder="Search for articles..."
                defaultValue={query}
                className="h-12 pl-11 pr-4"
              />
            </div>
            <Button type="submit" size="lg" variant="accent">
              Search
            </Button>
          </div>
        </form>

        {query && (
          <Suspense fallback={
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          }>
            <SearchResults query={query} generate={params.generate} />
          </Suspense>
        )}

        {!query && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Enter a search term to find articles</p>
          </div>
        )}
      </div>
    </div>
  );
}