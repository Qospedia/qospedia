import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArticleActions } from '@/components/ui/article-actions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', slug)
    .limit(10);
  
  const article = data && data.length > 0 ? data[0] : null;

  if (!article) {
    return { title: 'Article Not Found - Qospedia' };
  }

  return {
    title: `${article.title} - Qospedia`,
    description: article.summary || '',
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, summary, content, view_count, published_at, created_at, author_id, tags, wikipedia_title')
    .eq('slug', slug)
    .limit(10);
  
  const article = data && data.length > 0 ? data[0] : null;

  if (!article) {
    notFound();
  }

  await supabase
    .from('articles')
    .update({ view_count: (article?.view_count || 0) + 1 })
    .eq('id', article?.id);

  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, summary')
    .eq('status', 'published')
    .neq('id', article?.id)
    .limit(3);

  const tags = article?.tags || [];
  const content = article?.content || '';
  const lines = content.split('\n');
  const headings: { level: number; text: string; id: string }[] = [];
  
  lines.forEach((line: string) => {
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
                      className={`block text-[13px] text-[#050505] dark:text-[#CCCCCC] hover:text-[#2563EB] py-1 transition-colors ${heading.level === 3 ? 'pl-4' : ''}`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <header className="flex items-start justify-between gap-4 mb-8 pb-6 border-b border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                <div className="flex-1">
                  <h1 className="text-[32px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-4 tracking-tight leading-tight">
                    {article?.title}
                  </h1>
                  {article?.summary && (
                    <p className="text-[16px] text-[#636363] dark:text-[#858585] mb-6 leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                </div>
                <ArticleActions title={article?.title || ''} className="flex-shrink-0 mt-2" />
              </header>

              <ContentRenderer content={content} />

              {article?.wikipedia_title && (
                <div className="mt-12 p-4 bg-[#F7F7F7] dark:bg-[#0A0A0A] rounded-lg">
                  <p className="text-[14px] text-[#636363] dark:text-[#858585]">
                    Based on Wikipedia article &quot;{article.wikipedia_title}&quot;
                  </p>
                </div>
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
            </article>

            {relatedArticles && relatedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                <h2 className="text-[20px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-6">Related Articles</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {relatedArticles.map((related) => (
                    <a key={related.id} href={`/article/${related.slug}`} className="block p-4 bg-[#F7F7F7] dark:bg-[#0A0A0A] rounded-lg hover:shadow-md">
                      <h3 className="font-medium text-[#050505] dark:text-[#FCFCFC]">{related.title}</h3>
                      {related.summary && (
                        <p className="mt-2 text-[13px] text-[#636363] dark:text-[#858585] line-clamp-2">
                          {related.summary}
                        </p>
                      )}
                    </a>
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

function ContentRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line: string, index: number) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace('### ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h3 key={index} id={id} className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC] mt-8 mb-4 scroll-mt-24">
          {text}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      const text = trimmed.replace('## ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h2 key={index} id={id} className="text-[24px] font-semibold text-[#050505] dark:text-[#FCFCFC] mt-12 mb-6 scroll-mt-24">
          {text}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-[32px] font-bold text-[#050505] dark:text-[#FCFCFC] mt-8 mb-6">
          {trimmed.replace('# ', '')}
        </h1>
      );
    } else if (trimmed === '') {
      elements.push(<div key={index} className="h-4" />);
    } else {
      elements.push(
        <p key={index} className="text-[14px] leading-[26px] text-[#050505] dark:text-[#CCCCCC] mb-4">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });
  
  return <>{elements}</>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  const patterns: { regex: RegExp; render: (match: string) => React.ReactNode }[] = [
    { regex: /\*\*(.+?)\*\*/g, render: (m) => <strong key={keyIndex++}>{m}</strong> },
    { regex: /\*(.+?)\*/g, render: (m) => <em key={keyIndex++}>{m}</em> },
    { regex: /`(.+?)`/g, render: (m) => <code key={keyIndex++} className="px-1 py-0.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded text-[13px]">{m}</code> },
    { regex: /\[(.+?)\]\((.+?)\)/g, render: (m) => <a key={keyIndex++} href={m} className="text-[#2563EB] hover:underline" target="_blank" rel="noopener noreferrer">{m}</a> },
  ];
  
  let current = remaining;
  let lastEnd = 0;
  
  const allMatches: { start: number; end: number; element: React.ReactNode }[] = [];
  
  patterns.forEach(({ regex, render }) => {
    const regexCopy = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = regexCopy.exec(current)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        element: render(match[1]),
      });
    }
  });
  
  allMatches.sort((a, b) => a.start - b.start);
  
  const filtered: typeof allMatches = [];
  for (const m of allMatches) {
    if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
      filtered.push(m);
    }
  }
  
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) {
      result.push(<span key={keyIndex++}>{current.slice(pos, m.start)}</span>);
    }
    result.push(m.element);
    pos = m.end;
  }
  
  if (pos < current.length) {
    result.push(<span key={keyIndex++}>{current.slice(pos)}</span>);
  }
  
  return result.length > 0 ? result : [<span key={0}>{text}</span>];
}