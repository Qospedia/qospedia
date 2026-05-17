const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchTavily(query: string, maxResults = 5): Promise<TavilyResult[]> {
  if (!TAVILY_API_KEY) {
    console.warn('TAVILY_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: maxResults, include_answer: true }),
    });

    if (!response.ok) throw new Error(`Tavily error: ${response.statusText}`);
    const data = await response.json() as { results?: TavilyResult[] };
    return data.results || [];
  } catch (error) {
    console.error('Tavily search error:', error);
    return [];
  }
}

export async function getTopicResearch(topic: string): Promise<string> {
  const results = await searchTavily(topic, 5);
  if (results.length === 0) return '';
  return results.map(r => `Source: ${r.title}\n${r.content.slice(0, 500)}\n`).join('\n');
}