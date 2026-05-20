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

interface WikipediaImages {
  thumbnail: string | null;
  original: string | null;
  description: string;
  infobox: Record<string, string> | null;
}

async function fetchWikipediaImages(topic: string): Promise<WikipediaImages> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(topic)}&prop=pageimages|extracts&exintro=false&explaintext=true&pithumbsize=500&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return { thumbnail: null, original: null, description: '', infobox: null };
    
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return { thumbnail: null, original: null, description: '', infobox: null };
    
    const page = Object.values(pages)[0] as any;
    const thumbnail = page.thumbnail?.source || null;
    const original = page.originalimage?.source || thumbnail;
    const description = page.extract?.slice(0, 500) || '';
    
    return { thumbnail, original, description, infobox: null };
  } catch {
    return { thumbnail: null, original: null, description: '', infobox: null };
  }
}

async function fetchWikipediaSections(topic: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(topic)}&prop=text&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return '';
    
    const data = await res.json();
    return data.parse?.text?.['*'] || '';
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
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'llama-3.3-70b-versatile',
  ];
  
  for (const model of models) {
    try {
      console.log(`[AutoGenerate] Trying model: ${model}`);
      
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
        console.log(`[AutoGenerate] ${model} error: ${response.status} - ${errorText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log(`[AutoGenerate] ${model} returned ${content.length} chars`);
      
      if (content && content.length > 100) {
        return content;
      }
      console.log(`[AutoGenerate] ${model} content too short: ${content.length}`);
    } catch (e: any) {
      console.log(`[AutoGenerate] ${model} error: ${e.message}`);
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
    console.log('[AutoGenerate] Getting Supabase client...');
    const supabase = getSupabaseAdmin();
    console.log('[AutoGenerate] Supabase client ready');

    console.log('[AutoGenerate] Checking for existing articles...');
    const { data: existing, error: existingError } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', `%${topic}%`)
      .limit(1);

    if (existingError) {
      console.log('[AutoGenerate] Error checking existing:', existingError.message);
    }

    if (existing && existing.length > 0) {
      console.log(`[AutoGenerate] Article already exists: ${topic}`);
      return { success: true, generated: 0 };
    }

    console.log('[AutoGenerate] Fetching data sources...');
    
    // Fetch all data sources in parallel
    const [wikiSummary, wikiContent, wikiImages] = await Promise.all([
      fetchWikipediaFull(topic),
      fetchWikipediaFullContent(topic),
      fetchWikipediaImages(topic),
    ]);

    const tavilySources = await fetchTavilyResearch(topic);

    // Prepare image references
    const imageUrls = [];
    if (wikiImages?.thumbnail) {
      imageUrls.push({ url: wikiImages.thumbnail, source: 'Wikipedia', alt: topic });
    }

    // Build citations
    const citations: { title: string; url: string; source: string }[] = [
      ...(wikiSummary ? [{ title: (wikiSummary as any).title || topic, url: (wikiSummary as any).content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`, source: 'Wikipedia' }] : []),
      ...tavilySources.map((s, i) => ({ title: s.title, url: s.url, source: 'Web' })),
    ];

    const citationsText = citations.length > 0 
      ? '\n\n## References\n\n' + citations.map((c, i) => `${i + 1}. [${c.title}](${c.url}) - ${c.source}`).join('\n')
      : '';

    const imageSection = imageUrls.length > 0 
      ? '\n\n## Images\n\n' + imageUrls.map((img, i) => `![${img.alt}](${img.url})`).join('\n\n')
      : '';

    // Enhanced system prompt with all requirements
    const systemPrompt = `You are a professional encyclopedia writer. Write comprehensive articles in Markdown.

RULES:
- Start with ## Introduction
- Use ## for sections, ### for subsections
- Write 1500+ words
- Add tables for facts, bullet points for lists
- Include image if provided: ![alt](url)
- Cite with [1], [2], etc.
- End with References section
- NO code blocks, NO AI thinking text`;

    const userPrompt = `Write a comprehensive encyclopedia article about "${topic}".

WIKIPEDIA SUMMARY:
${wikiSummary?.extract ? wikiSummary.extract.slice(0, 800) : 'Not available'}

${wikiImages?.thumbnail ? `IMAGE: ${wikiImages.thumbnail}` : ''}

WEB SOURCES:
${tavilySources.slice(0, 3).map((s, i) => `${i + 1}. ${s.title}: ${s.content?.slice(0, 200) || ''}`).join('\n') || 'None'}

REQUIREMENTS:
- Start with "## Introduction"
- Write 1500+ words with ## headings
- Include tables for facts
- Add image if provided: ![topic](url)
- Cite with [1], [2]
- End with References section`;

    console.log('[AutoGenerate] Generating with GROQ...');
    
    const models = ['llama-3.1-8b-instant', 'qwen/qwen3-32b', 'llama-3.3-70b-versatile'];
    let content = '';
    let groqError = '';
    
    for (const model of models) {
      console.log(`[AutoGenerate] Trying model: ${model}`);
      const result = await callGroqDirect([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], model, 8000);
      
      if (result.success && result.content && result.content.length >= 100) {
        content = cleanAiContent(result.content);
        console.log(`[AutoGenerate] Success with model: ${model}, got ${content.length} chars`);
        break;
      } else {
        console.log(`[AutoGenerate] Model ${model} failed: ${result.error}, content length: ${result.content?.length || 0}`);
        groqError = result.error || 'Generation failed';
      }
    }
    
    if (!content || content.length < 100) {
      console.log('[AutoGenerate] Content too short or generation failed, saving topic to pending...');
      try {
        await supabase.from('pending_articles').insert({
          title: topic,
          slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          status: 'pending'
        });
      } catch (e) {
        console.log('[AutoGenerate] Could not save to pending_articles:', e);
      }
      
      return { success: false, generated: 0, error: groqError || 'AI service temporarily unavailable. Topic saved for later.' };
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Add image section to content if we have images
    let finalContent = content + citationsText;
    if (wikiImages?.thumbnail) {
      finalContent = `![${topic}](${wikiImages.thumbnail})\n\n` + finalContent;
    }
    
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
        content: finalContent,
        summary,
        featured_image: wikiImages?.thumbnail || null,
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
        source_title: c.title,
        source_url: c.url,
        source_author: '',
        source_date: '',
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