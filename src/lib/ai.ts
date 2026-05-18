const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODELS = {
  premium: 'llama-3.3-70b-versatile',
  balanced: 'qwen/qwen3-32b',
  fast: 'llama-3.1-8b-instant',
};

const FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.1-8b-instant',
];

interface ModelResult {
  model: string;
  content: string;
  success: boolean;
}

async function callGroqWithRetry(
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number = 4096
): Promise<ModelResult> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    });

    if (response.status === 429) {
      return { model, content: '', success: false };
    }

    if (!response.ok) {
      return { model, content: '', success: false };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { model, content, success: !!content };
  } catch {
    return { model, content: '', success: false };
  }
}

async function smartCallGroq(
  messages: { role: string; content: string }[],
  maxTokens: number = 4096,
  preferredTier: keyof typeof GROQ_MODELS = 'balanced'
): Promise<{ content: string; model: string }> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const modelOrder = [GROQ_MODELS[preferredTier], ...FALLBACK_CHAIN.filter(m => m !== GROQ_MODELS[preferredTier])];

  for (const model of modelOrder) {
    const result = await callGroqWithRetry(model, messages, maxTokens);
    if (result.success && result.content) {
      console.log(`[Groq] Success: ${model}`);
      return { content: result.content, model };
    }
  }

  throw new Error('All GROQ models failed');
}

export async function callGroq(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 4096
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const { content } = await smartCallGroq(messages, maxTokens);
  return content;
}

export async function fetchPageContent(url: string): Promise<string> {
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

export async function generateArticleDraft(topic: string, context?: string): Promise<string> {
  const userPrompt = context
    ? `Write a comprehensive encyclopedia article about "${topic}". Context: ${context}`
    : `Write a comprehensive encyclopedia article about "${topic}". Include introduction, main sections, and conclusion in Markdown.`;

  return callGroq(userPrompt, 'You are an encyclopedia article writer. Write well-structured content in Markdown format.');
}

export async function summarizeArticle(content: string): Promise<string> {
  return callGroq(
    `Summarize in 2-3 paragraphs:\n\n${content}`,
    'You are a helpful assistant that summarizes content concisely.',
    500
  );
}

export async function improveWriting(content: string): Promise<string> {
  return callGroq(
    `Improve the writing:\n\n${content}`,
    'You are an expert editor. Improve grammar, clarity, and make it more encyclopedic.',
    3000
  );
}

export async function suggestRelatedTopics(topic: string, existingTopics: string[] = []): Promise<string[]> {
  const existingStr = existingTopics.length > 0 ? `Existing topics: ${existingTopics.join(', ')}` : '';
  
  const result = await callGroq(
    `Suggest 8 related topics for "${topic}". ${existingStr}. Return only comma-separated topic names.`,
    'You suggest related encyclopedia topics.',
    300
  );

  return result.split(',').map(t => t.trim()).filter(Boolean).slice(0, 8);
}

export async function translateContent(content: string, targetLang: string): Promise<string> {
  return callGroq(
    `Translate to ${targetLang}:\n\n${content}`,
    'You are a professional translator.',
    3000
  );
}

export async function expandArticle(content: string): Promise<string> {
  return callGroq(
    `Expand this article with more details and examples:\n\n${content}`,
    'You are an encyclopedia writer. Expand with thorough explanations.',
    4000
  );
}

export async function factCheck(content: string): Promise<{ verified: boolean; issues: string[] }> {
  const result = await callGroq(
    `Analyze this text for factual accuracy issues. Return a JSON with "verified" (boolean) and "issues" (array of problems found):\n\n${content.slice(0, 2000)}`,
    'You are a fact-checker. Be critical and precise.',
    1000
  );

  try {
    return JSON.parse(result);
  } catch {
    return { verified: true, issues: [] };
  }
}