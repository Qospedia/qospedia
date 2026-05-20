const GROQ_MODELS = {
  premium: 'llama-3.3-70b-versatile',
  balanced: 'llama-3.1-8b-instant',
  fast: 'qwen/qwen3-32b',
};

const FALLBACK_CHAIN = [
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile',
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    console.log(`[Groq] Calling model: ${model}`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    });

    console.log(`[Groq] Response status: ${response.status}`);

    if (response.status === 429) {
      console.log(`[Groq] Rate limited on ${model}`);
      return { model, content: '', success: false };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Groq] Error response: ${errorText}`);
      return { model, content: '', success: false };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`[Groq] Success: ${model}, content length: ${content.length}`);
    return { model, content, success: !!content };
  } catch (err) {
    console.error(`[Groq] Exception:`, err);
    return { model, content: '', success: false };
  }
}

async function smartCallGroq(
  messages: { role: string; content: string }[],
  maxTokens: number = 4096,
  preferredTier: keyof typeof GROQ_MODELS = 'balanced'
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const modelOrder = [GROQ_MODELS[preferredTier], ...FALLBACK_CHAIN.filter(m => m !== GROQ_MODELS[preferredTier])];
  
  console.log(`[SmartGroq] Trying models: ${modelOrder.join(', ')}`);

  for (const model of modelOrder) {
    const result = await callGroqWithRetry(model, messages, maxTokens);
    if (result.success && result.content) {
      console.log(`[SmartGroq] Success with ${model}, got ${result.content.length} chars`);
      return { content: result.content, model };
    }
    console.log(`[SmartGroq] Model ${model} failed, trying next...`);
  }

  throw new Error('All GROQ models failed');
}

export async function callGroqDirect(
  messages: { role: string; content: string }[],
  model: string = 'llama-3.1-8b-instant',
  maxTokens: number = 16000
): Promise<{ content: string; success: boolean; error?: string }> {
  // Try NVIDIA NIM first for Qwen model
  if (model.includes('qwen')) {
    const nvidiaResult = await callNvidiaNIM(messages, model, maxTokens);
    if (nvidiaResult.success) return nvidiaResult;
  }
  
  // Fallback to Groq
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { content: '', success: false, error: 'GROQ_API_KEY not configured' };
  }

  try {
    console.log('[callGroqDirect] Using Groq model:', model);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[callGroqDirect] Error:', response.status, errorText.slice(0, 200));
      return { content: '', success: false, error: 'HTTP ' + response.status + ': ' + errorText };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[callGroqDirect] Success, got', content.length, 'chars');
    return { content, success: true };
  } catch (err: any) {
    console.log('[callGroqDirect] Exception:', err.message);
    return { content: '', success: false, error: err.message };
  }
}

async function callNvidiaNIM(
  messages: { role: string; content: string }[],
  model: string,
  maxTokens: number
): Promise<{ content: string; success: boolean; error?: string }> {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { content: '', success: false, error: 'No API key configured' };
  }

  try {
    console.log('[NVIDIA NIM] Calling model:', model);
    
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        model, 
        messages, 
        temperature: 0.7, 
        max_tokens: maxTokens 
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[NVIDIA NIM] Error:', response.status, errorText.slice(0, 200));
      return { content: '', success: false, error: 'NVIDIA HTTP ' + response.status };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[NVIDIA NIM] Success, got', content.length, 'chars');
    return { content, success: true };
  } catch (err: any) {
    console.log('[NVIDIA NIM] Exception:', err.message);
    return { content: '', success: false, error: err.message };
  }
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