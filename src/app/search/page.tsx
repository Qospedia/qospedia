import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Search as SearchIcon, FileText } from 'lucide-react';
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
  return {
    title: params.q ? `Search: ${params.q} - Qospedia` : 'Search - Qospedia',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';

  const supabase = await createClient();

  let results: any[] = [];
  let totalCount = 0;

  if (query.trim()) {
    const { data, count } = await supabase
      .from('articles')
      .select('*, author:profiles(full_name), categories:categories(*)', { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(20);

    results = data || [];
    totalCount = count || 0;
  }

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
          <div className="mb-6 text-muted-foreground">
            {totalCount === 0
              ? `No results found for "${query}"`
              : `Found ${totalCount} result${totalCount === 1 ? '' : 's'} for "${query}"`}
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Enter a search term to find articles</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((article) => (
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
        )}

        {query && results.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No articles found matching your search.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try different keywords or browse categories.</p>
            <Link href="/categories">
              <Button variant="outline" className="mt-4">
                Browse Categories
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}