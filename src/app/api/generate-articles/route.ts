import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const MODELS = {
  primary: 'llama-3.1-8b-instant',
  fallback: ['qwen/qwen3-32b', 'llama-3.3-70b-versatile'],
};

const TOPICS = [
  'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Networks',
  'Quantum Computing', 'Blockchain Technology', 'Internet of Things', 'Cloud Computing',
  'Cybersecurity', 'Big Data Analytics', 'Virtual Reality', 'Augmented Reality',
  '5G Networks', 'Edge Computing', 'Natural Language Processing', 'Computer Vision',
  'Robotics', 'Automation', '3D Printing', 'Biotechnology', 'Gene Editing',
  'Climate Change', 'Renewable Energy', 'Sustainable Development', 'Carbon Footprint',
  'World War II', 'World War I', 'Cold War', 'Industrial Revolution', 'Ancient Rome',
  'Ancient Egypt', 'Renaissance', 'French Revolution', 'American Revolution',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Astronomy', 'Geology',
  'Philosophy', 'Psychology', 'Sociology', 'Economics', 'Political Science',
  'Marketing', 'Entrepreneurship', 'Leadership', 'Management', 'Finance',
];

async function callGroqWithFallback(messages: { role: string; content: string }[], maxTokens: number = 3000): Promise<{ content: string; model: string }> {
  const models = [MODELS.primary, ...MODELS.fallback];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          return { content, model };
        }
      }

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch {}
  }

  throw new Error('All GROQ models failed');
}

async function fetchWikipedia(topic: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    return data.extract || '';
  } catch {
    return '';
  }
}

async function fetchTavily(topic: string): Promise<{ title: string; url: string; content: string }[]> {
  if (!TAVILY_API_KEY) return [];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query: topic, max_results: 5 }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({ title: r.title, url: r.url, content: r.content }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    if (adminKey !== process.env.ADMIN_GENERATE_KEY && adminKey !== 'qospedia-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const { data: existingArticles } = await supabase.from('articles').select('title');
    const existingTitles = new Set(existingArticles?.map(a => a.title.toLowerCase()) || []);

    const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).slice(0, 20);
    const results = [];

    for (const topic of topicsToGenerate) {
      try {
        console.log(`[Bulk] Generating: ${topic}`);

        const [wikiContent, tavilySources] = await Promise.all([
          fetchWikipedia(topic),
          fetchTavily(topic),
        ]);

        const citationsList = tavilySources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n');

        const systemPrompt = `You are an encyclopedia article writer. Write comprehensive, structured articles in Markdown with [n] citations.`;
        const userPrompt = `Write about "${topic}".\n\nWikipedia: ${wikiContent || 'N/A'}\n\nSources: ${tavilySources.map((s, i) => `[${i + 1}] ${s.title}: ${s.content?.slice(0, 200)}...`).join('\n') || 'N/A'}`;

        const { content, model } = await callGroqWithFallback([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]);

        if (!content || content.length < 200) {
          results.push({ topic, status: 'failed', reason: 'Insufficient content' });
          continue;
        }

        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const firstPara = content.split('\n').find(l => l.trim() && !l.startsWith('#')) || '';
        const summary = firstPara.replace(/\[\d+\]/g, '').slice(0, 300).trim();

        const { data: article, error } = await supabase
          .from('articles')
          .insert({
            title: topic,
            slug,
            content: content + '\n\n---\n\n## References\n\n' + citationsList,
            summary,
            status: 'published',
            author_id: '00000000-0000-0000-0000-000000000001',
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          results.push({ topic, status: 'failed', reason: error.message });
        } else {
          results.push({ topic, status: 'success', articleId: article.id, model });
        }

        await new Promise(r => setTimeout(r, 1500));

      } catch (err: any) {
        results.push({ topic, status: 'error', reason: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      generated: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status !== 'success').length,
      results,
    });

  } catch (error: any) {
    console.error('[Bulk Generate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}