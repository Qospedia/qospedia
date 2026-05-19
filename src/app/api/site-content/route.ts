import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const VALID_CONTENT_KEYS = [
  'tagline', 'about', 'privacy_policy', 'terms_of_service',
  'footer_about', 'meta_title', 'meta_description',
  'announcement', 'maintenance_mode', 'site_name'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const supabase = await createClient();
    
    if (key) {
      if (!VALID_CONTENT_KEYS.includes(key)) {
        return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
      }
      const { data } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', key)
        .single();
      return NextResponse.json({ value: data?.value || null });
    }

    const { data } = await supabase
      .from('site_content')
      .select('key, value');
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || !VALID_CONTENT_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
    }

    const { error } = await supabase
      .from('site_content')
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}