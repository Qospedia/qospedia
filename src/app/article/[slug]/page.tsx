import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, Eye, Edit, ThumbsUp, ExternalLink, BookOpen, Volume2, Copy, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function parseContent(content: string) {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let tableRows: string[][] = [];
  let inTable = false;
  let inList: string[] = [];
  
  const flushList = () => {
    if (inList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-1 mb-4">
          {inList.map((item, i) => (
            <li key={i} className="text-[14px] leading-[24px] text-[#050505] dark:text-[#CCCCCC]">{item}</li>
          ))}
        </ul>
      );
      inList = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
          <table className="w-full border-collapse border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
            <thead>
              <tr className="bg-[#F7F7F7] dark:bg-[#1A1A1A]">
                {tableRows[0].map((cell, i) => (
                  <th key={i} className="border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] px-4 py-2 text-left text-[14px] font-semibold text-[#050505] dark:text-[#FCFCFC]">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-[#0A0A0A]' : 'bg-[#F7F7F7] dark:bg-[#1A1A1A]'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] px-4 py-2 text-[14px] text-[#050505] dark:text-[#CCCCCC]">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      flushList();
      const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
      tableRows.push(cells);
      return;
    }
    
    if (inTable && !trimmed.startsWith('|')) {
      flushTable();
    }
    
    if (trimmed === '') {
      flushList();
      elements.push(<div key={idx} className="h-2" />);
      return;
    }
    
    if (trimmed.startsWith('# ')) {
      flushList();
      const text = trimmed.replace('# ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h2 key={idx} id={id} className="text-[22px] font-semibold text-[#050505] dark:text-[#FCFCFC] mt-8 mb-4 scroll-mt-20">
          <a href={`#${id}`} className="hover:text-[#2563EB]">{text}</a>
        </h2>
      );
      return;
    }
    
    if (trimmed.startsWith('## ')) {
      flushList();
      const text = trimmed.replace('## ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h3 key={idx} id={id} className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC] mt-6 mb-3 scroll-mt-20">
          <a href={`#${id}`} className="hover:text-[#2563EB]">{text}</a>
        </h3>
      );
      return;
    }
    
    if (trimmed.startsWith('### ')) {
      flushList();
      const text = trimmed.replace('### ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h4 key={idx} id={id} className="text-[16px] font-semibold text-[#050505] dark:text-[#FCFCFC] mt-4 mb-2 scroll-mt-20">
          <a href={`#${id}`} className="hover:text-[#2563EB]">{text}</a>
        </h4>
      );
      return;
    }
    
    if (trimmed.startsWith('![')) {
      const altMatch = trimmed.match(/!\[([^\]]*)\]/);
      const srcMatch = trimmed.match(/\((https?:\/\/[^\)]+)\)/);
      if (altMatch && srcMatch) {
        elements.push(
          <figure key={idx} className="my-6">
            <img 
              src={srcMatch[1]} 
              alt={altMatch[1]} 
              className="max-w-full rounded-lg"
            />
            {altMatch[1] && (
              <figcaption className="text-[12px] text-[#858585] dark:text-[#636363] mt-2 text-center">
                {altMatch[1]}
              </figcaption>
            )}
          </figure>
        );
        return;
      }
    }
    
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList.push(trimmed.replace(/^[*-] /, ''));
      return;
    }
    
    if (trimmed.match(/^\d+\./)) {
      inList.push(trimmed.replace(/^\d+\.\s*/, ''));
      return;
    }
    
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={idx} className="border-l-4 border-[#2563EB] pl-4 py-2 my-4 text-[#636363] dark:text-[#858585] italic bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-r-lg">
          {trimmed.replace('> ', '')}
        </blockquote>
      );
      return;
    }
    
    if (trimmed.startsWith('```')) {
      return;
    }
    
    flushList();
    
    let processedLine = trimmed;
    
    processedLine = processedLine.replace(/\[\[([^\]]+)\]\]/g, (_, content) => {
      const parts = content.split('|');
      const linkText = parts[1] || parts[0];
      const linkTarget = parts[0];
      return `<a href="/article/${linkTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-[#2563EB] hover:underline">${linkText}</a>`;
    });
    
    processedLine = processedLine.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#2563EB] hover:underline flex items-center gap-1">$1<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg></a>');
    
    elements.push(
      <p 
        key={idx} 
        className="text-[14px] leading-[26px] text-[#050505] dark:text-[#CCCCCC] mb-4"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
  
  flushList();
  flushTable();
  
  return elements;
}

function extractHeadings(content: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace('## ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 2, text, id });
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.replace('### ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 3, text, id });
    }
  });
  
  return headings;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
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
    description: article.summary || '',
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();

  console.log('Fetching article with slug:', slug);

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, summary, content, view_count, published_at, created_at, author_id, tags, wikipedia_title')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  console.log('Article query result:', article ? 'found' : 'not found', 'error:', error);

  if (error || !article) {
    console.log('Article not found:', slug, 'error:', JSON.stringify(error));
    notFound();
  }

  console.log('Article found:', article.title, 'slug:', article.slug);

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

  const tags = article.tags || [];
  const headings = extractHeadings(article.content);
  const parsedContent = parseContent(article.content);

  return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-[#F7F7F7] dark:bg-[#0A0A0A] rounded-lg p-4">
                <h3 className="text-[12px] font-semibold text-[#636363] dark:text-[#858585] uppercase tracking-wide mb-3">Contents</h3>
                <nav className="space-y-1">
                  {headings.map((heading, i) => (
                    <a
                      key={i}
                      href={`#${heading.id}`}
                      className={`block text-[13px] text-[#050505] dark:text-[#CCCCCC] hover:text-[#2563EB] py-1 transition-colors ${
                        heading.level === 3 ? 'pl-4' : ''
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="bg-[#F7F7F7] dark:bg-[#0A0A0A] rounded-lg p-4">
                <h3 className="text-[12px] font-semibold text-[#636363] dark:text-[#858585] uppercase tracking-wide mb-3">Tools</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#050505] dark:text-[#CCCCCC] hover:bg-[#E5E7EB] dark:hover:bg-[#1A1A1A] rounded-md transition-colors"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(article.content.replace(/[#*`\[\]]/g, ''));
                        utterance.rate = 1;
                        speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                    Read aloud
                  </button>
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#050505] dark:text-[#CCCCCC] hover:bg-[#E5E7EB] dark:hover:bg-[#1A1A1A] rounded-md transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy link
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <header className="mb-8 pb-6 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                <h1 className="text-[32px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-4 tracking-tight leading-tight">
                  {article.title}
                </h1>

                {article.summary && (
                  <p className="text-[16px] text-[#636363] dark:text-[#858585] mb-6 leading-relaxed">
                    {article.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 text-[13px] text-[#858585] dark:text-[#636363]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{article.published_at ? formatDate(article.published_at) : formatDate(article.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{article.view_count + 1} views</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#636363] dark:text-[#858585] bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(article.content.replace(/[#*`\[\]]/g, ''));
                        utterance.rate = 1;
                        speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                    Read aloud
                  </button>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#636363] dark:text-[#858585] bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy link
                  </button>
                  <Link href="/suggest" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#636363] dark:text-[#858585] bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-md hover:bg-[#E5E7EB] dark:hover:bg-[#2A2A2A] transition-colors">
                    <Edit className="h-4 w-4" />
                    Suggest edit
                  </Link>
                </div>
              </header>

              <div className="article-content">
                {parsedContent}
              </div>

              {article.wikipedia_title && (
                <Card className="mt-12 border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#F7F7F7] dark:bg-[#0A0A0A]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-[#050505] dark:text-[#FCFCFC] flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Wikipedia Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-[14px] text-[#636363] dark:text-[#858585] leading-relaxed">
                        This article is based on the Wikipedia article "{article.wikipedia_title}". 
                        For the most accurate and detailed information, you can view the original article.
                      </p>
                      <a 
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(article.wikipedia_title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[14px] text-[#2563EB] hover:underline"
                      >
                        View on Wikipedia
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tags.length > 0 && (
                <div className="mt-12 pt-6 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1.5 text-[13px] bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#636363] dark:text-[#858585] rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {citations && citations.length > 0 && (
                <Card className="mt-12 border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#F7F7F7] dark:bg-[#0A0A0A]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-[#050505] dark:text-[#FCFCFC] flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      References
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal pl-5 space-y-3">
                      {citations.map((citation, idx) => (
                        <li key={citation.id} className="text-[14px] text-[#636363] dark:text-[#858585]">
                          <span className="text-[#050505] dark:text-[#FCFCFC]">{citation.source_title}</span>
                          {citation.source_author && <span className="text-[#858585] dark:text-[#636363]"> by {citation.source_author}</span>}
                          {citation.source_date && <span className="text-[#858585] dark:text-[#636363]">, {citation.source_date}</span>}
                          {citation.source_url && (
                            <a
                              href={citation.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-[#2563EB] hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </article>

            <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] text-[#636363] dark:text-[#858585] hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A]">
                    <ThumbsUp className="h-4 w-4 mr-1.5" />
                    Helpful ({Math.floor(Math.random() * 100)})
                  </Button>
                </div>
              </div>
            </div>

            {relatedArticles && relatedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                <h2 className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-6">Related Articles</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {relatedArticles.map((related) => (
                    <Link key={related.id} href={`/article/${related.slug}`}>
                      <Card className="h-full border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#F7F7F7] dark:bg-[#0A0A0A] hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-[#050505] dark:text-[#FCFCFC] line-clamp-2 text-[14px]">{related.title}</h3>
                          {related.summary && (
                            <p className="mt-2 text-[13px] text-[#636363] dark:text-[#858585] line-clamp-2">
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
          </main>
        </div>
      </div>
    </div>
  );
}