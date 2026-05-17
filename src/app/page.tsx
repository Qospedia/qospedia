import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Search, BookOpen, Clock, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateExcerpt } from '@/lib/utils';
import { autoGenerateArticles, autoGenerateBulk } from '@/lib/auto-generate';

// This ensures articles are generated on server start if none exist
async function ensureArticles() {
  const supabase = await createClient();
  const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  
  const articleCount = count ?? 0;
  if (articleCount < 5) {
    console.log('[Home] Few articles found, generating more...');
    await autoGenerateBulk(10);
  }
}

export default async function HomePage() {
  // Auto-generate articles if needed
  await ensureArticles();

  const supabase = await createClient();

  const { data: featuredArticles } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name), categories:categories(*)')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(6);

  const { data: recentArticles } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
    .limit(8);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl animate-fade-in">
              Welcome to <span className="text-accent">Qospedia</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl animate-fade-in stagger-1">
              Your modern knowledge platform powered by AI. Discover, learn, and contribute to a growing library of articles.
            </p>
            <form action="/search" className="mt-8 flex gap-2 animate-fade-in stagger-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  placeholder="Search for any topic..."
                  className="h-12 pl-11 pr-4 text-base"
                />
              </div>
              <Button type="submit" size="lg" variant="accent">
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Featured Articles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Featured Articles</h2>
            </div>
            <Link href="/search">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredArticles && featuredArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article, index) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {article.categories?.slice(0, 2).map((cat: any) => (
                          <span key={cat.id} className="bg-secondary px-2 py-1 rounded">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.summary || generateExcerpt(article.content)}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{article.view_count} views</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No articles yet. Generating...</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                <span className="text-sm text-muted-foreground">AI is creating articles for you</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-2xl font-bold text-foreground">Browse by Category</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((category, index) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="transition-all hover:shadow-md hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-medium text-foreground">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Changes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-2xl font-bold text-foreground">Recently Published</h2>
          </div>

          <div className="space-y-4">
            {recentArticles?.map((article, index) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card className="transition-all hover:shadow-md animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {article.summary || generateExcerpt(article.content)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {article.author?.full_name && (
                        <p>by {article.author.full_name}</p>
                      )}
                      {article.published_at && (
                        <p>{new Date(article.published_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold">Join the Qospedia Community</h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Create an account to contribute articles, track your edits, and help build the knowledge base.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="accent">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}