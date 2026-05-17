const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1';

export interface WikipediaArticle {
  title: string;
  extract: string;
  content?: string;
  url: string;
}

export async function searchWikipedia(query: string): Promise<WikipediaArticle | null> {
  try {
    const response = await fetch(
      `${WIKIPEDIA_API}/page/summary/${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      title: data.title,
      extract: data.extract || '',
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${query.replace(/ /g, '_')}`,
    };
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
}

export async function getWikipediaContent(title: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${WIKIPEDIA_API}/page/html/${encodeURIComponent(title)}`,
      { headers: { 'Accept': 'text/html' } }
    );
    
    if (!response.ok) return null;
    
    const html = await response.text();
    // Extract text content from HTML (basic)
    return html.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim();
  } catch (error) {
    console.error('Wikipedia content error:', error);
    return null;
  }
}