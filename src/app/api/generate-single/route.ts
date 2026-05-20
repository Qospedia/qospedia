import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

async function callGroqWithFallback(messages: { role: string; content: string }[], maxTokens: number = 8000): Promise<{ content: string; model: string }> {
  const models = ['llama-3.1-8b-instant', 'qwen/qwen3-32b', 'llama-3.3-70b-versatile'];

  for (const model of models) {
    try {
      console.log(`[Groq] Trying model: ${model}`);
      
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
        console.log(`[Groq] ${model} returned ${content.length} chars`);
        
        if (content && content.length > 100) {
          return { content, model };
        }
        console.log(`[Groq] ${model} content too short: ${content.length}`);
      } else {
        const errorText = await response.text();
        console.log(`[Groq] ${model} error: ${response.status} - ${errorText.slice(0, 200)}`);
      }

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e: any) {
      console.log(`[Groq] ${model} exception: ${e.message}`);
    }
  }

  throw new Error('All GROQ models failed');
}

async function fetchWikipedia(topic: string): Promise<string> {
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

async function fetchWikipediaFull(topic: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(topic)}&prop=extracts&exintro=false&explaintext=true&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return '';
    const page = Object.values(pages)[0] as any;
    return page?.extract || '';
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
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query: topic, max_results: 5, include_answer: true }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({ title: r.title, url: r.url, content: r.content }));
  } catch {
    return [];
  }
}

function cleanContent(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/咀[\s\S]*?咀\n/g, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?/gi, '');
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, suggestionId } = body;

    if (!topic) {
      return NextResponse.json({ error: 'No topic provided' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[Generate Single] Topic: ${topic}`);

    const { data: existing } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', `%${topic}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        article: existing[0],
        message: 'Article already exists' 
      });
    }

    const [wikiSummary, wikiFull, tavilySources] = await Promise.all([
      fetchWikipedia(topic),
      fetchWikipediaFull(topic),
      fetchTavily(topic),
    ]);

    const citationsList = tavilySources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n');

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

Wikipedia Info: ${wikiSummary ? wikiSummary.slice(0, 1500) : 'Not available'}
Wikipedia Full: ${wikiFull ? wikiFull.slice(0, 2000) : 'Not available'}

${tavilySources.length > 0 ? 'Sources:\n' + tavilySources.slice(0, 5).map((s, i) => `[${i + 1}] ${s.title}`).join('\n') : ''}

Requirements:
- Start with "## Introduction"
- Include all major sections with ### subsections
- Use tables for facts
- Cite sources with [n]
- No thinking text, no code blocks`;

    const { content, model } = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 16000);

    if (!content || content.length < 800) {
      return NextResponse.json({ 
        error: 'Generated content too short. Please try again.' 
      }, { status: 500 });
    }

    const cleanedContent = cleanContent(content);
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const lines = cleanedContent.split('\n');
    const firstParagraph = lines.find(l => 
      l.trim() && 
      !l.startsWith('#') && 
      !l.startsWith('|') && 
      l.length > 80
    ) || '';
    const summary = firstParagraph.replace(/\[\d+\]/g, '').slice(0, 350).trim();

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: topic,
        slug,
        content: cleanedContent + '\n\n---\n\n## References\n\n' + citationsList,
        summary,
        status: 'published',
        author_id: '00000000-0000-0000-0000-000000000001',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Generate Single] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (tavilySources.length > 0) {
      const citationsToInsert = tavilySources.map((s, i) => ({
        article_id: article.id,
        source_title: s.title,
        source_url: s.url,
        source_author: '',
        source_date: '',
        order_index: i + 1
      }));

      await supabase.from('citations').insert(citationsToInsert);
    }

    if (suggestionId) {
      await supabase
        .from('article_suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestionId);
    }

    console.log(`[Generate Single] Success: ${topic}`);
    return NextResponse.json({ 
      success: true, 
      article,
      model 
    });

  } catch (error: any) {
    console.error('[Generate Single] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}