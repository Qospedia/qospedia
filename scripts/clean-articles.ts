import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

async function cleanArticles() {
  console.log('Starting article cleaning...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content')
    .eq('status', 'published');
  
  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }
  
  console.log(`Found ${articles?.length || 0} articles to check`);
  
  let cleaned = 0;
  
  for (const article of articles || []) {
    if (article.content.includes('<think>') || article.content.includes('咀')) {
      console.log(`Cleaning: ${article.title}`);
      
      const cleanedContent = cleanAiContent(article.content);
      
      if (cleanedContent !== article.content) {
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
          cleaned++;
        }
      }
    }
  }
  
  console.log(`Cleaned ${cleaned} articles`);
}

cleanArticles().catch(console.error);