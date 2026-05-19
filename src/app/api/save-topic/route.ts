import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const topic = formData.get('topic') as string;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('pending_articles')
      .insert({
        title: topic.trim(),
        slug,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[save-topic] Error:', error);
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(topic)}&error=Topic already saved`, request.url));
    }

    return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(topic)}&saved=true`, request.url));
  } catch (err: any) {
    console.error('[save-topic] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}