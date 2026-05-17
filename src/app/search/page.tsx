import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateExcerpt, slugify } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; generate?: string }>;
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

  if (articles.length > 0) {
    return (
      <>
        <div className="mb-6 text-muted-foreground">Found {totalCount} result{totalCount === 1 ? '' : 's'} for "{query}"</div>
        <div className="space-y-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="font-serif text-xl font-semibold text-foreground">{article.title}</h2>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {article.categories?.slice(0, 2).map((cat: any) => (
                          <span key={cat.id} className="bg-secondary px-2 py-0.5 rounded text-xs">{cat.name}</span>
                        ))}
                        {article.author?.full_name && <span>by {article.author.full_name}</span>}
                      </div>
                      <p className="mt-3 text-muted-foreground line-clamp-2">{article.summary || generateExcerpt(article.content)}</p>
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

  // Try to find a close match or suggest browsing
  const allArticles = await supabase.from('articles').select('title, slug').eq('status', 'published').limit(10);
  const suggestions = allArticles.data?.slice(0, 5) || [];

  return (
    <div className="text-center py-8">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">No articles found for "{query}"</p>
      <p className="text-sm text-muted-foreground mb-6">We're working on adding more content. Check back soon!</p>
      
      {suggestions.length > 0 && (
        <div className="max-w-md mx-auto">
          <p className="text-sm font-medium mb-3">You might be interested in:</p>
          <div className="space-y-2">
            {suggestions.map((a) => (
              <Link key={a.slug} href={`/article/${a.slug}`} className="block">
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4 text-left">
                    <span className="text-foreground hover:text-accent">{a.title}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/categories"><Button variant="outline">Browse Categories</Button></Link>
        <Link href="/recent"><Button variant="outline">Recent Articles</Button></Link>
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
              <Input name="q" type="search" placeholder="Search for articles..." defaultValue={query} className="h-12 pl-11 pr-4" />
            </div>
            <Button type="submit" size="lg" variant="accent">Search</Button>
          </div>
        </form>

        {query && (
          <Suspense fallback={
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          }>
            <SearchResults query={query} />
          </Suspense>
        )}

        {!query && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Enter a search term to find articles</p>
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