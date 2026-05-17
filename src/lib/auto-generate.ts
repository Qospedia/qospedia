'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  'Space Exploration', 'Mars', 'Black Holes', 'Climate Science', 'Oceanography',
];

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function autoGenerateArticles(limit = 5): Promise<{ success: boolean; generated: number }> {
  console.log('[AutoGenerate] Starting...');
  
  if (!GROQ_API_KEY) {
    console.log('[AutoGenerate] GROQ_API_KEY not configured');
    return { success: false, generated: 0 };
  }

  // Get existing articles
  const { data: existing } = await supabase.from('articles').select('title');
  const existingTitles = new Set(existing?.map(a => a.title.toLowerCase()) || []);
  
  // Filter topics we don't have yet
  const topicsToGenerate = TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).slice(0, limit);
  
  if (topicsToGenerate.length === 0) {
    console.log('[AutoGenerate] All topics already exist');
    return { success: true, generated: 0 };
  }

  console.log(`[AutoGenerate] Generating ${topicsToGenerate.length} articles...`);

  let generated = 0;

  for (const topic of topicsToGenerate) {
    try {
      console.log(`[AutoGenerate] Creating: ${topic}`);
      
      // Get research from Tavily
      let research = '';
      if (TAVILY_API_KEY) {
        try {
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: TAVILY_API_KEY, query: topic, max_results: 3 }),
          });
          const data = await tavilyRes.json();
          research = (data.results || []).map((r: any) => `Source: ${r.title}\n${r.content}`).join('\n\n');
        } catch (e) {
          console.log(`[AutoGenerate] Tavily failed for ${topic}`);
        }
      }

      // Get Wikipedia info
      let wiki = '';
      try {
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        const wikiData = await wikiRes.json();
        wiki = wikiData.extract || '';
      } catch (e) {
        console.log(`[AutoGenerate] Wikipedia failed for ${topic}`);
      }

      // Generate with Groq
      const messages = [
        { role: 'system', content: 'Write comprehensive encyclopedia articles in Markdown. Include intro, sections with H2, and conclusion. Make it informative and well-structured.' },
        { role: 'user', content: `Write about "${topic}".\n\nWikipedia: ${wiki}\n\nResearch: ${research}` },
      ];

      const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || '';

      if (!content) continue;

      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const lines = content.split('\n');
      const firstLine = lines.find(l => l.trim() && !l.startsWith('#')) || '';
      const summary = firstLine.slice(0, 200);

      const { error } = await supabase.from('articles').insert({
        title: topic,
        slug,
        content,
        summary,
        status: 'published',
        author_id: '00000000-0000-0000-0000-000000000001',
        published_at: new Date().toISOString(),
      });

      if (!error) {
        generated++;
        console.log(`[AutoGenerate] Created: ${topic}`);
      }
    } catch (err) {
      console.log(`[AutoGenerate] Error for ${topic}:`, err);
    }
  }

  console.log(`[AutoGenerate] Done! Generated ${generated} articles`);
  return { success: true, generated };
}