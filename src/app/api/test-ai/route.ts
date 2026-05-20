import { NextResponse } from 'next/server';

export async function GET() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not found', hasKey: false }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Write a short paragraph about Python programming language' }],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `API Error: ${response.status}`, 
        details: errorText,
        hasKey: true 
      }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return NextResponse.json({ 
      success: true, 
      content: content.slice(0, 500),
      contentLength: content.length,
      model: data.model 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Exception', 
      message: error.message,
      hasKey: true 
    }, { status: 500 });
  }
}