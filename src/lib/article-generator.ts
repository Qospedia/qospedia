'use server';

import { createClient } from '@/lib/supabase/server';
import { searchTavily } from './tavily';
import { searchWikipedia, getWikipediaContent } from './wikipedia';
import { slugify, generateExcerpt } from './utils';
import { callGroq } from './ai';

interface GeneratedArticle {
  id: string;
  slug: string;
  title: string;
}

export async function generateArticleFromSearch(topic: string): Promise<GeneratedArticle | null> {
  console.log(`[Article Generator] Starting for topic: ${topic}`);
  
  const supabase = await createClient();

  // Get admin user for creating articles
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, use a default admin user ID (you may need to adjust this)
  const adminUserId = user?.id || '00000000-0000-0000-0000-000000000001';

  // 1. Get Wikipedia content for the topic
  console.log('[Article Generator] Searching Wikipedia...');
  const wikiArticle = await searchWikipedia(topic);
  let wikiContent = wikiArticle?.extract || '';
  
  if (wikiArticle) {
    const fullContent = await getWikipediaContent(wikiArticle.title);
    if (fullContent) {
      wikiContent = fullContent.slice(0, 3000); // Limit content size
    }
  }

  // 2. Get Tavily search results for additional research
  console.log('[Article Generator] Searching Tavily...');
  const tavilyResults = await searchTavily(topic, 5);
  
  const researchSources = tavilyResults
    .map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
    .join('\n\n');

  // 3. Generate comprehensive article using AI
  console.log('[Article Generator] Generating article with AI...');
  
  const systemPrompt = `You are an expert encyclopedia article writer. Write comprehensive, well-structured articles in Markdown format with:
- A clear introduction
- Multiple sections covering key aspects
- Proper citations and sources
- A neutral, encyclopedic tone
- Wikipedia-level quality content`;

  const userPrompt = `
Create a comprehensive encyclopedia article about "${topic}".

${wikiContent ? `Wikipedia Information:\n${wikiContent}\n\n` : ''}
${researchSources ? `Additional Research:\n${researchSources}\n\n` : ''}

Write a full article in Markdown format. Include:
1. A brief summary (2-3 sentences)
2. Introduction
3. Main sections with H2 headings
4. Subsections with H3 where needed
5. Proper citations referencing the sources above
6. A conclusion if appropriate

Make it comprehensive, accurate, and suitable for an encyclopedia.`;

  try {
    const articleContent = await callGroq(userPrompt, systemPrompt);
    
    // Extract title from the generated content or use the topic
    const title = topic;
    const slug = slugify(title);
    
    // Extract summary from first paragraph or generate one
    const lines = articleContent.split('\n');
    let summary = '';
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        summary = line.slice(0, 200);
        break;
      }
    }

    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      console.log('[Article Generator] Article already exists');
      return { id: existing.id, slug: existing.slug, title };
    }

    // Insert the article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content: articleContent,
        summary: summary || generateExcerpt(articleContent),
        status: 'published',
        author_id: adminUserId,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Article Generator] Error inserting article:', error);
      return null;
    }

    console.log('[Article Generator] Article created successfully:', article.id);

    // Save sources as citations
    const sources = [
      ...(wikiArticle ? [{ title: wikiArticle.title, url: wikiArticle.url }] : []),
      ...tavilyResults.map(r => ({ title: r.title, url: r.url })),
    ];

    for (let i = 0; i < sources.length; i++) {
      await supabase.from('citations').insert({
        article_id: article.id,
        source_title: sources[i].title,
        source_url: sources[i].url,
        order_index: i + 1,
        accessed_at: new Date().toISOString(),
      });
    }

    return { id: article.id, slug: article.slug, title: article.title };
  } catch (error) {
    console.error('[Article Generator] Error generating article:', error);
    return null;
  }
}