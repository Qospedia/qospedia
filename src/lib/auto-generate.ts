'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function autoGenerateArticles(topic: string): Promise<{ success: boolean; generated: number }> {
  console.log(`[AutoGenerate] Generating article for: ${topic}`);
  
  if (!GROQ_API_KEY) {
    console.log('[AutoGenerate] GROQ_API_KEY not configured');
    return { success: false, generated: 0 };
  }

  // Check if article already exists
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
    // Get Wikipedia info
    let wikiContent = '';
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const wikiData = await wikiRes.json();
      wikiContent = wikiData.extract || '';
    } catch (e) {
      console.log('[AutoGenerate] Wikipedia fetch failed');
    }

    // Get Tavily research
    let researchContent = '';
    if (TAVILY_API_KEY) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            api_key: TAVILY_API_KEY, 
            query: topic, 
            max_results: 3 
          }),
        });
        const data = await tavilyRes.json();
        researchContent = (data.results || [])
          .map((r: any) => `Source: ${r.title}\n${r.content}`)
          .join('\n\n');
      } catch (e) {
        console.log('[AutoGenerate] Tavily fetch failed');
      }
    }

    // Generate with Groq AI
    const systemPrompt = `You are an encyclopedia article writer. Write comprehensive, well-structured articles in Markdown format. Include:
- A brief summary at the start
- Multiple sections with H2 headings
- Detailed paragraphs explaining each aspect
- A conclusion at the end
Write in a neutral, informative tone suitable for an encyclopedia.`;

    const userPrompt = `Write a comprehensive encyclopedia article about "${topic}".\n\nWikipedia Summary: ${wikiContent}\n\nWeb Research: ${researchContent}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.log('[AutoGenerate] Groq API error:', response.statusText);
      return { success: false, generated: 0 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      console.log('[AutoGenerate] No content generated');
      return { success: false, generated: 0 };
    }

    // Create slug and summary
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const lines = content.split('\n');
    const firstLine = lines.find((l: string) => l.trim() && !l.startsWith('#')) || '';
    const summary = firstLine.slice(0, 200);

    // Insert article
    const { error } = await supabase.from('articles').insert({
      title: topic,
      slug,
      content,
      summary,
      status: 'published',
      author_id: '00000000-0000-0000-0000-000000000001',
      published_at: new Date().toISOString(),
    });

    if (error) {
      console.log('[AutoGenerate] Insert error:', JSON.stringify(error));
      return { success: false, generated: 0 };
    }

    console.log(`[AutoGenerate] Successfully created article: ${topic} with slug: ${slug}`);
    return { success: true, generated: 1 };

  } catch (err) {
    console.log('[AutoGenerate] Error:', err);
    return { success: false, generated: 0 };
  }
}

// Bulk generation for pre-defined topics
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
  console.log('[AutoGenerate Bulk] Starting...');
  
  if (!GROQ_API_KEY) {
    return { success: false, generated: 0 };
  }

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
  }

  return { success: true, generated };
}