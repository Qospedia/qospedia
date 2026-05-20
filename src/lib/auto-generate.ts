'use server';

import { createClient } from '@supabase/supabase-js';
import { callGroqDirect } from './ai';

interface SourceData {
  title: string;
  url: string;
  content: string;
}

interface WikipediaData {
  extract: string;
  extract_html: string;
  description: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

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

function getJinaApiKey(): string | undefined {
  return process.env.JINA_API_KEY;
}

async function fetchWithJina(url: string): Promise<string> {
  const apiKey = getJinaApiKey();
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, { headers });
    const data = await res.json();
    return data.content || '';
  } catch {
    return '';
  }
}

async function fetchWikipediaFull(topic: string): Promise<WikipediaData | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return {
      extract: data.extract || '',
      extract_html: data.extract_html || '',
      description: data.description || '',
      thumbnail: data.thumbnail,
      originalimage: data.originalimage,
      content_urls: data.content_urls,
    };
  } catch {
    return null;
  }
}

async function fetchWikipediaFullContent(topic: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(topic)}&prop=extracts&exintro=false&explaintext=true&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return '';
    
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return '';
    
    const page = Object.values(pages)[0] as any;
    return page?.extract || '';
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
      body: JSON.stringify({ 
        api_key: apiKey, 
        query: topic, 
        max_results: 10,
        include_answer: true,
        include_raw_content: false
      }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({ 
      title: r.title, 
      url: r.url, 
      content: r.content 
    }));
  } catch {
    return [];
  }
}

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens: number = 8000
): Promise<string> {
  const apiKey = getGroqApiKey();
  
  const models = [
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-70b-versatile',
    'qwen/qwen3-32b',
    'llama-3.1-8b-instant',
  ];
  
  for (const model of models) {
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
          temperature: 0.5,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[Groq] ${model} error: ${response.status} - ${errorText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      if (content && content.length > 500) {
        return content;
      }
    } catch (e: any) {
      console.log(`[Groq] ${model} error: ${e.message}`);
    }
  }

  throw new Error('All GROQ models failed');
}

function cleanAiContent(content: string): string {
  let cleaned = content;
  
  cleaned = cleaned.replace(/咀[\s\S]*?咀\n/g, '');
  cleaned = cleaned.replace(/咀[\s\S]*?$/gim, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?/gi, '');
  cleaned = cleaned.replace(/```\n咀/g, '```');
  cleaned = cleaned.replace(/```$/gm, '');
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  const lines = cleaned.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed === '```' || trimmed === '```markdown' || trimmed === '```md') return false;
    if (trimmed.startsWith('<think>')) return false;
    if (trimmed.includes('Let me write') || trimmed.includes('I need to') || trimmed.includes('In this article')) {
      if (line.length < 100) return false;
    }
    return true;
  });
  
  let result = filtered.join('\n');
  result = result.replace(/^\s*咀\s*/gim, '');
  result = result.replace(/\s*咀\s*$/gim, '');
  
  return result.trim();
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
      console.log(`[AutoGenerate] Article already exists: ${topic}`);
      return { success: true, generated: 0 };
    }

    console.log('[AutoGenerate] Fetching data sources...');
    
    const [wikiSummary, wikiContent] = await Promise.all([
      fetchWikipediaFull(topic),
      fetchWikipediaFullContent(topic),
    ]);

    const tavilySources = await fetchTavilyResearch(topic);

    const citations = tavilySources.map((s, i) => ({
      source_title: s.title,
      source_url: s.url,
      source_author: '',
      source_date: ''
    }));

    const citationsText = citations.length > 0 
      ? '\n\n## References\n\n' + citations.map((c, i) => `${i + 1}. [${c.source_title}](${c.source_url})`).join('\n')
      : '';

    const systemPrompt = `You are a professional encyclopedia writer for Qospedia. Write comprehensive, well-structured articles.

RULES:
1. NEVER include AI thinking or self-referential text
2. Start immediately with "## Introduction"
3. Write AT LEAST 1500 words
4. Use ## for major sections, ### for subsections
5. Include tables for factual information
6. Cite sources inline with [1], [2]
7. Do NOT use code blocks

SECTIONS TO INCLUDE:
## Introduction
## Historical Background
## Key Concepts
## Applications and Uses
## Impact and Significance
## Notable Examples
## Current Research
## Challenges and Controversies
## Future Outlook
## References

Start with "## Introduction". No preamble.`;

    const userPrompt = `Write a 1500+ word encyclopedia article about "${topic}".

Wikipedia Info: ${wikiSummary?.extract ? wikiSummary.extract.slice(0, 1500) : 'Not available'}

${tavilySources.length > 0 ? 'Sources:\n' + tavilySources.slice(0, 5).map((s, i) => `[${i + 1}] ${s.title}`).join('\n') : ''}

Requirements:
- Start with "## Introduction"
- Include all major sections with ### subsections
- Use tables for facts
- Cite sources with [n]
- No thinking text, no code blocks`;

    console.log('[AutoGenerate] Generating with GROQ...');
    
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b'];
    let content = '';
    let groqError = '';
    
    for (const model of models) {
      const result = await callGroqDirect([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], model, 16000);
      
      if (result.success && result.content && result.content.length >= 800) {
        content = cleanAiContent(result.content);
        console.log(`[AutoGenerate] Success with model: ${model}`);
        break;
      } else {
        console.log(`[AutoGenerate] Model ${model} failed: ${result.error}`);
        groqError = result.error || 'Generation failed';
      }
    }
    
    if (!content || content.length < 800) {
      console.log('[AutoGenerate] Content too short or generation failed, saving topic to pending...');
      await supabase.from('pending_articles').insert({
        title: topic,
        slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        status: 'pending'
      });
      
      return { success: false, generated: 0, error: groqError || 'AI service temporarily unavailable. Topic saved for later.' };
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const lines = content.split('\n');
    const firstParagraph = lines.find(l => 
      l.trim() && 
      !l.startsWith('#') && 
      !l.startsWith('|') && 
      l.length > 80
    ) || '';
    const summary = firstParagraph.replace(/\[\d+\]/g, '').replace(/\[source\]/gi, '').slice(0, 350).trim();

    console.log('[AutoGenerate] Inserting article...');
    
    const { data: articleData, error: insertError } = await supabase
      .from('articles')
      .insert({
        title: topic,
        slug,
        content: content + citationsText,
        summary,
        status: 'published',
        author_id: '00000000-0000-0000-0000-000000000001',
        published_at: new Date().toISOString(),
        wikipedia_title: topic,
        view_count: 0,
      })
      .select('id')
      .single();

    if (insertError) {
      console.log('[AutoGenerate] Insert error:', insertError);
      return { success: false, generated: 0, error: insertError.message };
    }

    if (citations.length > 0 && articleData) {
      const citationsToInsert = citations.map((c, i) => ({
        article_id: articleData.id,
        source_title: c.source_title,
        source_url: c.source_url,
        source_author: c.source_author,
        source_date: c.source_date,
        order_index: i + 1
      }));

      await supabase.from('citations').insert(citationsToInsert);
    }

    console.log(`[AutoGenerate] Success: "${topic}" (${content.length} chars)`);
    return { success: true, generated: 1 };

  } catch (err: any) {
    console.error('[AutoGenerate] Error:', err);
    return { success: false, generated: 0, error: err.message };
  }
}

export async function regenerateArticle(topic: string): Promise<{ success: boolean; generated: number; error?: string }> {
  console.log(`[Regenerate] Starting: ${topic}`);

  try {
    const supabase = getSupabaseAdmin();

    await supabase
      .from('articles')
      .delete()
      .ilike('title', `%${topic}%`);

    return autoGenerateArticles(topic);
  } catch (err: any) {
    console.error('[Regenerate] Error:', err);
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
      await new Promise(r => setTimeout(r, 3000));
    }

    return { success: true, generated };
  } catch {
    return { success: false, generated: 0 };
  }
}

export async function cleanArticleContent(content: string): Promise<string> {
  return cleanAiContent(content);
}