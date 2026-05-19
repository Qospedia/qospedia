import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return { title: `Test: ${slug}` };
}

export default async function TestPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('articles')
    .select('id, title, slug')
    .eq('slug', slug);

  return (
    <div>
      <h1>Slug: {slug}</h1>
      <p>Data: {data ? JSON.stringify(data) : 'null'}</p>
      {(!data || data.length === 0) && notFound()}
    </div>
  );
}