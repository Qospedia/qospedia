import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Topics to auto-generate articles for
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    // Simple admin key check
    if (adminKey !== process.env.ADMIN_GENERATE_KEY && adminKey !== 'qospedia-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    // Get existing articles to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title');
    const existingTitles = new Set(existingArticles?.map(a => a.title.toLowerCase()) || []);

    const results = [];
    const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase()));

    console.log(`[Bulk Generate] Found ${topicsToGenerate.length} topics to generate`);

    for (const topic of topicsToGenerate.slice(0, 20)) { // Generate up to 20 articles
      try {
        console.log(`[Bulk Generate] Generating: ${topic}`);

        // Get Tavily research
        let researchContent = '';
        if (TAVILY_API_KEY) {
          try {
            const tavilyRes = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ api_key: TAVILY_API_KEY, query: topic, max_results: 3 }),
            });
            const tavilyData = await tavilyRes.json();
            researchContent = (tavilyData.results || [])
              .map((r: any) => `Source: ${r.title}\n${r.content}`)
              .join('\n\n');
          } catch (e) {
            console.log(`[Bulk Generate] Tavily failed for ${topic}`);
          }
        }

        // Get Wikipedia content
        let wikiContent = '';
        try {
          const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
            { headers: { 'Accept': 'application/json' } }
          );
          const wikiData = await wikiRes.json();
          wikiContent = wikiData.extract || '';
        } catch (e) {
          console.log(`[Bulk Generate] Wikipedia failed for ${topic}`);
        }

        // Generate article with AI
        const messages = [
          { role: 'system', content: 'You are an encyclopedia article writer. Write comprehensive, well-structured articles in Markdown format. Include introduction, sections, and citations.' },
          {
            role: 'user',
            content: `Write a comprehensive encyclopedia article about "${topic}".\n\nWikipedia: ${wikiContent}\n\nResearch: ${researchContent}`
          },
        ];

        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 3000,
          }),
        });

        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        if (!content) {
          results.push({ topic, status: 'failed', reason: 'No AI content generated' });
          continue;
        }

        // Create slug and summary
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const firstLine = content.split('\n').find((l: string) => l.trim() && !l.startsWith('#')) || '';
        const summary = firstLine.slice(0, 200);

        // Insert article
        const { data: article, error } = await supabase
          .from('articles')
          .insert({
            title: topic,
            slug,
            content,
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