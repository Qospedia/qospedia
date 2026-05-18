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
    .select('id, title, slug, summary, published_at, created_at')
    .eq('status', 'published')
    .limit(20);

  const categoryArticles = articles || [];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-[20px] font-semibold text-[#050505]">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-[14px] text-[#636363]">{category.description}</p>
          )}
        </header>

        {categoryArticles.length > 0 ? (
          <div className="space-y-4">
            {categoryArticles.map((article: any, index) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <h2 className="text-[16px] font-semibold text-[#050505]">{article.title}</h2>
                    {article.summary && (
                      <p className="mt-2 text-[14px] text-[#636363] line-clamp-2">{article.summary}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-[12px] text-[#858585]">
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
            <p className="text-[14px] text-[#636363]">No articles in this category yet.</p>
            <Link href="/editor/new">
              <span className="text-[#2563EB] hover:underline cursor-pointer">Be the first to add one!</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}