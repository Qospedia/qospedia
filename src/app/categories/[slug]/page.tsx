import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from('categories').select('name').eq('slug', slug).single();
  return { title: category ? `${category.name} - Qospedia Categories` : 'Category - Qospedia' };
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

  const { data: parentCategory } = category.parent_id 
    ? await supabase.from('categories').select('name, slug').eq('id', category.parent_id).single()
    : { data: null };

  const { data: subCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .order('"order"');

  const { data: categoryArticles } = await supabase
    .from('article_categories')
    .select('articles(id, title, slug, summary, published_at, created_at, view_count)')
    .eq('category_id', category.id);

  const articles = categoryArticles?.map(ca => ca.articles).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-[#050505] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/categories">
          <Button variant="ghost" className="mb-4 text-[#636363] dark:text-[#858585] hover:text-[#050505] dark:hover:text-[#FCFCFC]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Categories
          </Button>
        </Link>

        <header className="mb-8">
          {parentCategory && (
            <div className="flex items-center gap-2 text-[14px] text-[#636363] dark:text-[#858585] mb-2">
              <Link href={`/categories/${parentCategory.slug}`} className="hover:text-[#2563EB]">
                {parentCategory.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span>{category.name}</span>
            </div>
          )}
          <h1 className="text-[32px] font-bold text-[#050505] dark:text-[#FCFCFC]">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-[16px] text-[#636363] dark:text-[#858585]">{category.description}</p>
          )}
        </header>

        {subCategories && subCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-4">Subcategories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {subCategories.map((sub) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <div className="p-3 bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] rounded-lg hover:border-[#2563EB] dark:hover:border-[#2563EB] transition-colors">
                    <span className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">{sub.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-4">
            Articles in {category.name}
          </h2>
          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article: any) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card className="transition-all hover:shadow-md hover:border-[#2563EB] dark:hover:border-[#2563EB]">
                    <CardContent className="p-4">
                      <h3 className="text-[16px] font-semibold text-[#050505] dark:text-[#FCFCFC]">{article.title}</h3>
                      {article.summary && (
                        <p className="mt-2 text-[14px] text-[#636363] dark:text-[#858585] line-clamp-2">{article.summary}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-[12px] text-[#858585]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(article.published_at || article.created_at).toLocaleDateString()}
                        </span>
                        <span>{article.view_count || 0} views</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#F7F7F7] dark:bg-[#0A0A0A] rounded-xl border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
              <p className="text-[16px] text-[#636363] dark:text-[#858585]">No articles in this category yet.</p>
              <Link href="/editor/new">
                <span className="text-[#2563EB] hover:underline cursor-pointer mt-2 inline-block">Be the first to add one!</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}