import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, generateExcerpt } from '@/lib/utils';

export const metadata = {
  title: 'Recent Changes - Qospedia',
  description: 'Recently published articles and updates',
};

export default async function RecentPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, summary, view_count, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Clock className="h-6 w-6 text-accent" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Recent Changes</h1>
        </div>

        <div className="space-y-4">
          {articles?.map((article, index) => (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <Card className="transition-all hover:shadow-md animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-serif text-xl font-semibold text-foreground">{article.title}</h2>
                      {article.summary && (
                        <p className="mt-2 text-muted-foreground line-clamp-2">{article.summary}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{article.view_count} views</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {article.published_at && <p>{formatDate(article.published_at)}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(!articles || articles.length === 0) && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No recent changes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}