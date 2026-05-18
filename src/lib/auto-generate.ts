'use server';

import { createClient } from '@supabase/supabase-js';

interface SourceData {
  title: string;
  url: string;
  content: string;
}

interface ModelConfig {
  id: string;
  tier: 'premium' | 'balanced' | 'fast';
  maxTokens: number;
  quality: number;
  speed: number;
}

const GROQ_MODELS: ModelConfig[] = [
  { id: 'llama-3.3-70b-versatile', tier: 'premium', maxTokens: 32768, quality: 10, speed: 1 },
  { id: 'qwen/qwen3-32b', tier: 'balanced', maxTokens: 40960, quality: 9, speed: 3 },
  { id: 'openai/gpt-oss-20b', tier: 'balanced', maxTokens: 65536, quality: 8, speed: 3 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', tier: 'balanced', maxTokens: 8192, quality: 8, speed: 4 },
  { id: 'llama-3.1-8b-instant', tier: 'fast', maxTokens: 131072, quality: 6, speed: 5 },
];

const MODEL_PRIORITY: Record<string, string[]> = {
  premium: ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'openai/gpt-oss-20b'],
  balanced: ['qwen/qwen3-32b', 'openai/gpt-oss-20b', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant'],
  fast: ['llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct', 'qwen/qwen3-32b'],
  all: ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'openai/gpt-oss-20b', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant'],
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  return key;
}

function getTavilyApiKey(): string | undefined {
  return process.env.TAVILY_API_KEY;
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

async function fetchTavilyResearch(topic: string): Promise<SourceData[]> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) return [];
  
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query: topic, max_results: 5, include_answer: true }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({ title: r.title, url: r.url, content: r.content }));
  } catch {
    return [];
  }
}

async function callGroqWithFallback(
  messages: { role: string; content: string }[],
  maxTokens: number = 3000,
  tier: keyof typeof MODEL_PRIORITY = 'balanced'
): Promise<string> {
  const apiKey = getGroqApiKey();
  const models = MODEL_PRIORITY[tier];

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt];
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || '30';
        console.log(`[Groq] Rate limited on ${model}, waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        console.log(`[Groq] ${model} error ${response.status}: ${error.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      if (content && content.length > 100) {
        console.log(`[Groq] Success with ${model} (${tier} tier)`);
        return content;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log(`[Groq] ${model} timed out, trying next...`);
      } else {
        console.log(`[Groq] ${model} error: ${e.message.substring(0, 80)}`);
      }
    }
  }

  for (const model of MODEL_PRIORITY.all) {
    if (models.includes(model)) continue;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: Math.min(maxTokens, 2000),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          console.log(`[Groq] Emergency fallback success with ${model}`);
          return content;
        }
      }
    } catch {}
  }

  throw new Error('All GROQ models unavailable');
}

async function generateWithMultipleModels(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; model: string }> {
  const models = ['qwen/qwen3-32b', 'openai/gpt-oss-20b', 'meta-llama/llama-4-scout-17b-16e-instruct'];
  const promises = models.map(async (model) => {
    const apiKey = getGroqApiKey();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { model, content: data.choices?.[0]?.message?.content || '', score: (data.choices?.[0]?.message?.content || '').length };
    }
    return { model, content: '', score: 0 };
  });

  const results = await Promise.allSettled(promises);
  const validResults = results
    .filter((r): r is PromiseFulfilledResult<{model: string; content: string; score: number}> => 
      r.status === 'fulfilled' && r.value.content.length > 200
    )
    .map(r => r.value)
    .sort((a, b) => b.score - a.score);

  if (validResults.length > 0) {
    console.log(`[MultiModel] Best result from: ${validResults[0].model} (${validResults[0].content.length} chars)`);
    return { content: validResults[0].content, model: validResults[0].model };
  }

  return callGroqWithFallback(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    3000,
    'premium'
  ).then(content => ({ content, model: 'llama-3.3-70b-versatile' }));
}

export async function autoGenerateArticles(topic: string): Promise<{ success: boolean; generated: number; error?: string }> {
  console.log(`[AutoGenerate] Starting: ${topic}`);

  try {
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', `%${topic}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, generated: 0 };
    }

    console.log('[AutoGenerate] Fetching data sources...');
    const [wikiContent, tavilySources] = await Promise.all([
      fetchWikipediaSummary(topic),
      fetchTavilyResearch(topic),
    ]);

    const citationsList = tavilySources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n');

    const systemPrompt = `You are an expert encyclopedia article writer. Write comprehensive, well-structured articles in Markdown format with proper citations [n] where you reference sources.

Structure: Introduction, History/Background, Main Content, Impact/Significance, Conclusion, References.`;

    const userPrompt = `Write a detailed encyclopedia article about "${topic}".

WIKIPEDIA: ${wikiContent || 'No Wikipedia summary'}

SOURCES: ${tavilySources.map((s, i) => `[${i + 1}] ${s.title}: ${s.content?.slice(0, 300)}...`).join('\n\n') || 'No additional sources'}`;

    console.log('[AutoGenerate] Generating with multi-model system...');
    const { content, model: usedModel } = await generateWithMultipleModels(systemPrompt, userPrompt);

    if (!content || content.length < 200) {
      return { success: false, generated: 0, error: 'Insufficient content generated' };
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const lines = content.split('\n');
    const firstParagraph = lines.find(l => l.trim() && !l.startsWith('#')) || '';
    const summary = firstParagraph.replace(/\[\d+\]/g, '').slice(0, 300).trim();

    const { error } = await supabase.from('articles').insert({
      title: topic,
      slug,
      content: content + '\n\n---\n\n## References\n\n' + citationsList,
      summary,
      status: 'published',
      author_id: '00000000-0000-0000-0000-000000000001',
      published_at: new Date().toISOString(),
    });

    if (error) {
      console.log('[AutoGenerate] Insert error:', error);
      return { success: false, generated: 0, error: error.message };
    }

    console.log(`[AutoGenerate] Success: "${topic}" (${usedModel})`);
    return { success: true, generated: 1 };

  } catch (err: any) {
    console.error('[AutoGenerate] Error:', err);
    return { success: false, generated: 0, error: err.message };
  }
}

export async function autoGenerateBulk(limit = 10): Promise<{ success: boolean; generated: number }> {
  console.log('[Bulk Generate] Starting...');

  const TOPICS = [
    'Artificial Intelligence', 'Machine Learning', 'Quantum Computing', 'Blockchain',
    'Internet of Things', 'Cybersecurity', 'Climate Change', 'Renewable Energy',
    'World War II', 'Industrial Revolution', 'Philosophy', 'Psychology',
    'Biology', 'Physics', 'Astronomy', 'Photography', 'Cinema', 'Music',
  ];

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('articles').select('title');
    const existingTitles = new Set(existing?.map(a => a.title.toLowerCase()) || []);

    const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).slice(0, limit);

    let generated = 0;
    for (const topic of topicsToGenerate) {
      const result = await autoGenerateArticles(topic);
      if (result.generated > 0) generated++;
      await new Promise(r => setTimeout(r, 2000));
    }

    return { success: true, generated };
  } catch {
    return { success: false, generated: 0 };
  }
}

export async function enhanceWithGroq(content: string, task: 'improve' | 'summarize' | 'expand'): Promise<string> {
  const prompts = {
    improve: { instruction: 'Improve the writing quality', maxTokens: 3000 },
    summarize: { instruction: 'Summarize in 3 paragraphs', maxTokens: 500 },
    expand: { instruction: 'Expand with more details and examples', maxTokens: 4000 },
  };

  const { instruction, maxTokens } = prompts[task];
  
  return callGroqWithFallback([
    { role: 'system', content: 'You are an expert editor.' },
    { role: 'user', content: `${instruction}:\n\n${content}` }
  ], maxTokens, 'balanced');
}