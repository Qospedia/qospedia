import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Globe, Heart, Clock, Activity, Calculator, Atom, Users, Brain, Cross, Building, Cpu, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Categories - Qospedia',
  description: 'Browse articles organized by topic - Wikipedia-style categories',
};

const iconMap: Record<string, any> = {
  book: BookOpen,
  globe: Globe,
  heart: Heart,
  clock: Clock,
  activity: Activity,
  calculator: Calculator,
  atom: Atom,
  users: Users,
  brain: Brain,
  cross: Cross,
  building: Building,
  cpu: Cpu,
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('"order"');

  const { data: articleCounts } = await supabase
    .from('article_categories')
    .select('category_id');

  const countByCategory = articleCounts?.reduce((acc, item) => {
    acc[item.category_id] = (acc[item.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const mainCategories = categories?.filter(c => !c.parent_id) || [];
  const subCategoriesByParent = categories?.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
      acc[cat.parent_id].push(cat);
    }
    return acc;
  }, {} as Record<string, typeof categories>);

  return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-[#050505] py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-[#050505] dark:text-[#FCFCFC]">Categories</h1>
          <p className="mt-2 text-[16px] text-[#636363] dark:text-[#858585]">
            Browse articles organized by topic — parallel to Wikipedia's category system
          </p>
        </div>

        <div className="grid gap-8">
          {mainCategories.map((category) => {
            const IconComponent = iconMap[category.icon] || BookOpen;
            const subs = subCategoriesByParent[category.id] || [];
            
            return (
              <div key={category.id} className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <IconComponent 
                      className="h-6 w-6" 
                      style={{ color: category.color }} 
                    />
                  </div>
                  <div className="flex-1">
                    <Link href={`/categories/${category.slug}`}>
                      <h2 className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC] hover:text-[#2563EB] dark:hover:text-[#2563EB] transition-colors">
                        {category.name}
                      </h2>
                    </Link>
                    {category.description && (
                      <p className="mt-1 text-[14px] text-[#636363] dark:text-[#858585]">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[24px] font-bold" style={{ color: category.color }}>
                      {countByCategory[category.id] || 0}
                    </span>
                    <p className="text-[12px] text-[#858585]">articles</p>
                  </div>
                </div>

                {subs.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                    {subs.map((sub: any) => (
                      <Link 
                        key={sub.id} 
                        href={`/categories/${sub.slug}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A] transition-colors group"
                      >
                        <ChevronRight className="h-4 w-4 text-[#858585] group-hover:text-[#2563EB] transition-colors" />
                        <span className="text-[14px] text-[#636363] dark:text-[#858585] group-hover:text-[#050505] dark:group-hover:text-[#FCFCFC]">
                          {sub.name}
                        </span>
                        <span className="text-[12px] text-[#858585] ml-auto">
                          {countByCategory[sub.id] || 0}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-[#F7F7F7] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] rounded-xl">
          <h3 className="text-[16px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/categories/general-reference" className="text-[14px] text-[#2563EB] hover:underline">All Categories</Link>
            <span className="text-[#858585]">•</span>
            <Link href="/categories/technology-and-applied-sciences" className="text-[14px] text-[#2563EB] hover:underline">Technology</Link>
            <span className="text-[#858585]">•</span>
            <Link href="/categories/natural-and-physical-sciences" className="text-[14px] text-[#2563EB] hover:underline">Science</Link>
            <span className="text-[#858585]">•</span>
            <Link href="/categories/history-and-events" className="text-[14px] text-[#2563EB] hover:underline">History</Link>
            <span className="text-[#858585]">•</span>
            <Link href="/categories/health-and-fitness" className="text-[14px] text-[#2563EB] hover:underline">Health</Link>
          </div>
        </div>
      </div>
    </div>
  );
}