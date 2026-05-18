'use server';

import { createClient } from '@supabase/supabase-js';

interface SourceData {
  title: string;
  url: string;
  content: string;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY not configured');
  }
  return key;
}

function getTavilyApiKey(): string | undefined {
  return process.env.TAVILY_API_KEY;
}

function getJinaApiKey(): string | undefined {
  return process.env.JINA_API_KEY;
}

async function fetchWikipediaSummary(topic: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return data.extract || '';
  } catch {
    return '';
  }
}

async function fetchWithJina(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    const jinaKey = getJinaApiKey();
    if (jinaKey) {
      headers['Authorization'] = `Bearer ${jinaKey}`;
    }
    const res = await fetch(`https://r.jina.ai/${url}`, { headers, next: { revalidate: 3600 } });
    const data = await res.json();
    return data.content || '';
  } catch {
    return '';
  }
}

async function fetchTavilyResearch(topic: string): Promise<SourceData[]> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    console.log('[Tavily] API key not configured, skipping...');
    return [];
  }
  
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: topic,
        max_results: 5,
        include_answer: true,
      }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  } catch (e) {
    console.log('[Tavily] Search failed:', e);
    return [];
  }
}

async function fetchWebSearchSources(topic: string): Promise<SourceData[]> {
  const sources: SourceData[] = [];
  
  const authoritativeSources = [
    `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
  ];

  for (const url of authoritativeSources) {
    try {
      const content = await fetchWithJina(url);
      if (content && content.length > 100) {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        sources.push({
          title: titleMatch?.[1] || topic,
          url,
          content: content.slice(0, 2000),
        });
      }
    } catch (e) {
      console.log('[WebSearch] Failed to fetch:', url);
    }
  }
  
  return sources;
}

async function generateWithGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getGroqApiKey();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('No content generated from Groq');
  }
  
  return content;
}

export async function autoGenerateArticles(topic: string): Promise<{ success: boolean; generated: number; error?: string }> {
  console.log(`[AutoGenerate] Starting article generation for: ${topic}`);

  let supabase: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    console.error('[AutoGenerate] Failed to create Supabase client:', e);
    return { success: false, generated: 0, error: 'Database configuration error' };
  }

  try {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      console.log('[AutoGenerate] GROQ_API_KEY not configured');
      return { success: false, generated: 0, error: 'GROQ_API_KEY not configured' };
    }
  } catch (e: any) {
    console.error('[AutoGenerate]', e.message);
    return { success: false, generated: 0, error: e.message };
  }

  const { data: existing } = await supabase
    .from('articles')
    .select('id, title')
    .ilike('title', `%${topic}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('[AutoGenerate] Article already exists');
    return { success: true, generated: 0 };
  }

  try {
    console.log('[AutoGenerate] Fetching data sources...');
    
    const [wikiContent, tavilySources, webSources] = await Promise.all([
      fetchWikipediaSummary(topic),
      fetchTavilyResearch(topic),
      fetchWebSearchSources(topic),
    ]);

    console.log(`[AutoGenerate] Wikipedia: ${wikiContent.length} chars`);
    console.log(`[AutoGenerate] Tavily: ${tavilySources.length} sources`);
    console.log(`[AutoGenerate] Web: ${webSources.length} sources`);

    const allSources = [...tavilySources, ...webSources];
    const citationsList = allSources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n');

    const systemPrompt = `You are an expert encyclopedia article writer with a background in academic writing and research. Your task is to write comprehensive, well-structured, and properly cited encyclopedia articles.

Requirements:
1. Write in formal, neutral, encyclopedic tone
2. Use Markdown format with proper headings (H2 for main sections, H3 for subsections)
3. Include citations using [n] format where you reference sources
4. Structure: Introduction, History/Background, Main Content Sections, Impact/Significance, Conclusion
5. Always include a References section at the end listing all sources used
6. Be thorough but avoid padding - every sentence should add value`;

    const userPrompt = `Write a comprehensive encyclopedia article about "${topic}".

WIKIPEDIA SUMMARY:
${wikiContent || 'No Wikipedia summary available'}

AUTHORITATIVE WEB SOURCES:
${allSources.length > 0 ? allSources.map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\nContent: ${s.content.slice(0, 500)}...`).join('\n\n') : 'No additional sources available'}

Based on the above sources, write a detailed encyclopedia article. Cite your sources using [n] notation where you reference specific information. Include a proper References section at the end.`;

    console.log('[AutoGenerate] Generating article with Groq...');
    const content = await generateWithGroq(systemPrompt, userPrompt);

    if (!content || content.length < 200) {
      console.log('[AutoGenerate] Insufficient content generated');
      return { success: false, generated: 0, error: 'Insufficient content generated' };
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const lines = content.split('\n');
    const firstParagraph = lines.find(l => l.trim() && !l.startsWith('#')) || '';
    const summary = firstParagraph.replace(/\[\d+\]/g, '').slice(0, 300).trim();

    const { error: insertError } = await supabase.from('articles').insert({
      title: topic,
      slug,
      content: content + '\n\n---\n\n## Sources\n\n' + citationsList,
      summary,
      status: 'published',
      author_id: '00000000-0000-0000-0000-000000000001',
      published_at: new Date().toISOString(),
    });

    if (insertError) {
      console.log('[AutoGenerate] Insert error:', insertError);
      return { success: false, generated: 0, error: `Database error: ${insertError.message}` };
    }

    console.log(`[AutoGenerate] Success: Created article "${topic}" with slug "${slug}"`);
    return { success: true, generated: 1 };

  } catch (err: any) {
    console.error('[AutoGenerate] Error:', err);
    return { success: false, generated: 0, error: err.message || 'Unknown error' };
  }
}

const TOPICS = [
  'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Networks',
  'Quantum Computing', 'Blockchain Technology', 'Internet of Things', 'Cloud Computing',
  'Cybersecurity', 'Big Data', 'Virtual Reality', 'Augmented Reality',
  'Robotics', 'Automation', '3D Printing', 'Biotechnology', 'Gene Editing',
  'Climate Change', 'Renewable Energy', 'Sustainability', 'Electric Vehicles',
  'World War II', 'World War I', 'Cold War', 'Industrial Revolution', 'Ancient Rome',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Astronomy',
  'Philosophy', 'Psychology', 'Economics', 'Marketing', 'Leadership',
  'Photography', 'Cinema', 'Music', 'Literature', 'Art History',
  'Yoga', 'Meditation', 'Nutrition', 'Fitness', 'Mental Health',
];

export async function autoGenerateBulk(limit = 10): Promise<{ success: boolean; generated: number }> {
  console.log('[Bulk Generate] Starting...');

  try {
    getGroqApiKey();
  } catch {
    return { success: false, generated: 0 };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from('articles').select('title');
  const existingTitles = new Set(existing?.map(a => a.title.toLowerCase()) || []);

  const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).slice(0, limit);

  if (topicsToGenerate.length === 0) {
    return { success: true, generated: 0 };
  }

  let generated = 0;

  for (const topic of topicsToGenerate) {
    const result = await autoGenerateArticles(topic);
    if (result.generated > 0) generated++;
    await new Promise(r => setTimeout(r, 1000));
  }

  return { success: true, generated };
}