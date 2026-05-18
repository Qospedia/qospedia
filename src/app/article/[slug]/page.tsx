import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, Eye, User, Edit, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, generateExcerpt } from '@/lib/utils';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return { title: 'Article Not Found - Qospedia' };
  }

  return {
    title: `${article.title} - Qospedia`,
    description: article.summary || generateExcerpt(article.summary || ''),
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, summary, content, view_count, published_at, created_at, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  await supabase
    .from('articles')
    .update({ view_count: article.view_count + 1 })
    .eq('id', article.id);

  const { data: citations } = await supabase
    .from('citations')
    .select('*')
    .eq('article_id', article.id)
    .order('order_index');

  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, summary')
    .eq('status', 'published')
    .neq('id', article.id)
    .limit(3);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {article.categories?.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-xl text-muted-foreground mb-6">
                {article.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {article.author?.full_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.author.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Published {article.published_at ? formatDate(article.published_at) : formatDate(article.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{article.view_count + 1} views</span>
              </div>
            </div>
          </header>

          <div className="mb-12">
            {article.content.split('\n').map((paragraph: string, idx: number) => {
              if (paragraph.startsWith('# ')) {
                return <h1 key={idx} style={{ fontSize: '1.875rem', fontWeight: 'bold', fontFamily: 'Georgia, serif', color: '#1e3a5f', marginTop: '2rem', marginBottom: '1rem' }}>{paragraph.replace('# ', '')}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={idx} style={{ fontSize: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', color: '#1e3a5f', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={idx} style={{ fontSize: '1.25rem', fontWeight: '600', fontFamily: 'Georgia, serif', color: '#1e3a5f', marginTop: '1rem', marginBottom: '0.5rem' }}>{paragraph.replace('### ', '')}</h3>;
              }
              if (paragraph.trim() === '') {
                return <br key={idx} />;
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return <li key={idx} style={{ marginBottom: '0.5rem', marginLeft: '1.5rem' }}>{paragraph.replace(/^[*-] /, '')}</li>;
              }
              if (paragraph.match(/^\d+\./)) {
                return <li key={idx} style={{ marginBottom: '0.5rem', marginLeft: '1.5rem' }}>{paragraph.replace(/^\d+\.\s/, '')}</li>;
              }
              if (paragraph.startsWith('> ')) {
                return <blockquote key={idx} style={{ borderLeft: '4px solid #e07a5f', paddingLeft: '1rem', fontStyle: 'italic', color: '#6b7280', margin: '1rem 0' }}>{paragraph.replace('> ', '')}</blockquote>;
              }
              if (paragraph.startsWith('```')) {
                return null;
              }
              return paragraph.startsWith('http') ? (
                <a key={idx} href={paragraph} target="_blank" rel="noopener noreferrer" style={{ color: '#e07a5f', textDecoration: 'underline' }}>{paragraph}</a>
              ) : (
                <p key={idx} style={{ fontSize: '1.125rem', lineHeight: '1.75', color: 'var(--foreground)', marginBottom: '1rem' }}>{paragraph}</p>
              );
            })}
          </div>

          {citations && citations.length > 0 && (
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="text-lg">Sources & Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2">
                  {citations.map((citation) => (
                    <li key={citation.id} className="text-sm">
                      {citation.source_title}
                      {citation.source_url && (
                        <a
                          href={citation.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline ml-1"
                        >
                          [source]
                        </a>
                      )}
                      {citation.source_author && <span className="text-muted-foreground"> by {citation.source_author}</span>}
                      {citation.source_date && <span className="text-muted-foreground">, {citation.source_date}</span>}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </article>

        {relatedArticles && relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/article/${related.slug}`}>
                  <Card className="transition-all hover:shadow-md hover:-translate-y-1">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground line-clamp-2">{related.title}</h3>
                      {related.summary && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {related.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}