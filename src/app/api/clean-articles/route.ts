import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function cleanAiContent(content: string): string {
  let cleaned = content;
  
  cleaned = cleaned.replace(/<think>[\s\S]*?咀/gi, '');
  cleaned = cleaned.replace(/咀[\s\S]*?$/gim, '');
  cleaned = cleaned.replace(/```咀[\s\S]*?咀```/gi, '');
  cleaned = cleaned.replace(/```咀[\s\S]*?咀\n```/gi, '');
  cleaned = cleaned.replace(/咀\s*/g, '');
  cleaned = cleaned.replace(/\n咀\n*/g, '\n\n');
  cleaned = cleaned.replace(/咀\n*/g, '\n');
  cleaned = cleaned.replace(/咀\n咀\n咀/g, '');
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, content')
      .eq('status', 'published');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${articles?.length || 0} articles to check`);

    let cleaned = 0;

    for (const article of articles || []) {
      if (article.content.includes('<think>') || article.content.includes('咀')) {
        const cleanedContent = cleanAiContent(article.content);
        
        const lines = cleanedContent.split('\n');
        const firstParagraph = lines.find(l => 
          l.trim() && 
          !l.startsWith('#') && 
          !l.startsWith('|') && 
          l.length > 80
        ) || '';
        
        const summary = firstParagraph
          .replace(/\[\d+\]/g, '')
          .replace(/\[source\]/gi, '')
          .slice(0, 350)
          .trim();
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({ content: cleanedContent, summary })
          .eq('id', article.id);
        
        if (updateError) {
          console.error(`Error updating ${article.title}:`, updateError);
        } else {
          console.log(`Cleaned: ${article.title}`);
          cleaned++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      cleaned,
      message: `Cleaned ${cleaned} articles` 
    });
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}