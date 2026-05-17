import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { generateExcerpt } from '@/lib/utils';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from('categories').select('name').eq('slug', slug).single();
  return { title: category ? `${category.name} - Qospedia` : 'Category - Qospedia' };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  const { data: articles } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name)')
    .eq('status', 'published')
    .limit(20);

  const categoryArticles = articles?.filter((a: any) => 
    a.categories?.some((c: any) => c.slug === slug)
  ) || [];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-muted-foreground">{category.description}</p>
          )}
        </header>

        {categoryArticles.length > 0 ? (
          <div className="space-y-4">
            {categoryArticles.map((article: any, index) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card className="transition-all hover:shadow-md animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground">{article.title}</h2>
                    {article.summary && (
                      <p className="mt-2 text-muted-foreground line-clamp-2">{article.summary}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      {article.author?.full_name && <span>by {article.author.full_name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(article.published_at || article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles in this category yet.</p>
            <Link href="/editor/new">
              <span className="text-accent hover:underline cursor-pointer">Be the first to add one!</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}