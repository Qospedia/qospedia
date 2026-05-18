'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/utils';
import { generateArticleDraft } from '@/lib/ai';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setUser(data.user);
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data }) => {
        if (!data || (data.role !== 'editor' && data.role !== 'admin')) {
          router.push('/');
          return;
        }
        setProfile(data);
      });
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const slug = slugify(title);

    const { data: existing } = await supabase.from('articles').select('id').eq('slug', slug).single();
    if (existing) {
      toast({ title: 'Error', description: 'An article with this title already exists', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        summary: summary || content.slice(0, 200),
        status: 'draft',
        author_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await supabase.from('article_revisions').insert({
      article_id: article.id,
      title,
      summary: summary || content.slice(0, 200),
      content,
      editor_id: user.id,
      created_at: new Date().toISOString(),
      change_summary: 'Initial draft',
    });

    toast({ title: 'Success', description: 'Article created as draft' });
    router.push(`/editor/${article.id}`);
  };

  const handleGenerateDraft = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Enter a topic first', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const draft = await generateArticleDraft(title);
      setContent(draft);
      toast({ title: 'Success', description: 'AI draft generated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate draft', variant: 'destructive' });
    }
    setGenerating(false);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold text-[#050505]">Create New Article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-[14px] font-medium text-[#050505]">Title</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title..."
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateDraft}
                    disabled={generating || !title.trim()}
                    className="bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]"
                  >
                    {generating ? 'Generating...' : 'AI Draft'}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="summary" className="text-[14px] font-medium text-[#050505]">Summary (optional)</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-[14px] font-medium text-[#050505]">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article content in Markdown..."
                  className="min-h-[400px] mt-1 font-mono text-[14px]"
                  required
                />
                <p className="mt-2 text-[12px] text-[#858585]">
                  Supports Markdown formatting
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}