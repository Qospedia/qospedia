const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json() as { choices?: { message: { content: string } }[] };
  return data.choices?.[0]?.message?.content || '';
}

export async function generateArticleDraft(topic: string, context?: string): Promise<string> {
  const userPrompt = context
    ? `Write a comprehensive encyclopedia article about "${topic}". Context: ${context}`
    : `Write a comprehensive encyclopedia article about "${topic}". Include an introduction, main sections covering key aspects, and a conclusion. Format in Markdown.`;

  return callGroq(userPrompt, 'You are a helpful encyclopedia article writer. Write well-structured, encyclopedic content in Markdown format. Use clear headings, balanced sections, and maintain a neutral, informative tone.');
}

export async function summarizeArticle(content: string): Promise<string> {
  return callGroq(
    `Summarize the following article in 2-3 paragraphs:\n\n${content}`,
    'You are a helpful assistant that summarizes content. Provide a concise summary.'
  );
}

export async function improveWriting(content: string): Promise<string> {
  return callGroq(
    `Improve the following article:\n\n${content}`,
    'You are an expert editor. Improve the writing quality while maintaining the original meaning. Fix grammar, improve clarity, and make it more encyclopedic in tone.'
  );
}

export async function suggestRelatedTopics(topic: string, existingTopics: string[]): Promise<string[]> {
  const existingStr = existingTopics.length > 0 ? `Existing topics: ${existingTopics.join(', ')}` : '';
  
  const result = await callGroq(
    `Suggest related topics for "${topic}". ${existingStr}. Return only the topic names separated by commas.`,
    'You are a helpful assistant that suggests related topics. Return only a comma-separated list of 5-8 related topics.'
  );

  return result.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 8);
}