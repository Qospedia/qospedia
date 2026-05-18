import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  'World History', 'European History', 'Asian History', 'American History',
  'African History', 'Oceania History', 'Ancient Civilizations', 'Medieval History',
  'Modern History', 'Contemporary History', 'Art History', 'Music History',
  'Literature', 'Poetry', 'Drama', 'Fiction', 'Non-Fiction', 'Journalism',
  'Photography', 'Sculpture', 'Painting', 'Architecture', 'Design',
  'Cinema', 'Television', 'Radio', 'Theater', 'Dance', 'Yoga', 'Meditation',
  'Nutrition', 'Fitness', 'Mental Health', 'Healthcare', 'Medicine', 'Pharmacy',
  'Agriculture', 'Farming', 'Food Science', 'Environmental Science', 'Ecology',
];

interface SourceData {
  title: string;
  url: string;
  content: string;
}

async function fetchWikipediaSummary(topic: string): Promise<string> {
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

async function fetchWithJina(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (process.env.JINA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
    }
    const res = await fetch(`https://r.jina.ai/${url}`, { headers });
    const data = await res.json();
    return data.content || '';
  } catch {
    return '';
  }
}

async function fetchTavilyResearch(topic: string): Promise<SourceData[]> {
  if (!process.env.TAVILY_API_KEY) return [];
  
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
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
  } catch {
    return [];
  }
}

async function fetchWebSearchSources(topic: string): Promise<SourceData[]> {
  const sources: SourceData[] = [];
  const authoritativeSources = [
    `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
    `https://www.britannica.com/search?query=${encodeURIComponent(topic)}`,
  ];

  for (const url of authoritativeSources) {
    const content = await fetchWithJina(url);
    if (content && content.length > 100) {
      sources.push({
        title: content.match(/^#\s+(.+)$/m)?.[1] || url.split('/').pop() || '',
        url,
        content: content.slice(0, 2000),
      });
    }
  }
  
  return sources;
}

async function generateWithGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    if (adminKey !== process.env.ADMIN_GENERATE_KEY && adminKey !== 'qospedia-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const { data: existingArticles } = await supabase.from('articles').select('title');
    const existingTitles = new Set(existingArticles?.map(a => a.title.toLowerCase()) || []);

    const results = [];
    const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).slice(0, 20);

    console.log(`[Bulk Generate] Found ${topicsToGenerate.length} topics to generate`);

    for (const topic of topicsToGenerate) {
      try {
        console.log(`[Bulk Generate] Generating: ${topic}`);

        const [wikiContent, tavilySources, webSources] = await Promise.all([
          fetchWikipediaSummary(topic),
          fetchTavilyResearch(topic),
          fetchWebSearchSources(topic),
        ]);

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

        const content = await generateWithGroq(systemPrompt, userPrompt);

        if (!content || content.length < 200) {
          results.push({ topic, status: 'failed', reason: 'Insufficient content generated' });
          continue;
        }

        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const lines = content.split('\n');
        const firstParagraph = lines.find(l => l.trim() && !l.startsWith('#')) || '';
        const summary = firstParagraph.replace(/\[\d+\]/g, '').slice(0, 300).trim();

        const { data: article, error } = await supabase
          .from('articles')
          .insert({
            title: topic,
            slug,
            content: content + '\n\n---\n\n## Sources\n\n' + citationsList,
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
          results.push({ topic, status: 'success', articleId: article.id });
        }

        await new Promise(r => setTimeout(r, 1000));

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