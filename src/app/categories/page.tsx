import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Categories - Qospedia',
  description: 'Browse articles by category',
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  const { data: articleCounts } = await supabase
    .from('article_categories')
    .select('category_id');

  const countByCategory = articleCounts?.reduce((acc, item) => {
    acc[item.category_id] = (acc[item.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold text-[#050505]">Categories</h1>
          <p className="mt-2 text-[14px] text-[#636363]">
            Browse articles organized by topic
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category, index) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Card className="transition-all hover:shadow-md hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#050505]">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="mt-2 text-[14px] text-[#636363] line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="bg-[#F7F7F7] rounded-full p-2">
                      <BookOpen className="h-4 w-4 text-[#2563EB]" />
                    </div>
                  </div>
                  <div className="mt-4 text-[14px] text-[#858585]">
                    {countByCategory[category.id] || 0} articles
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}