'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { formatDate, generateExcerpt } from '@/lib/utils';
import { generateArticleDraft, improveWriting, summarizeArticle } from '@/lib/ai';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [article, setArticle] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setUser(data.user);
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: profileData }) => {
        if (!profileData || (profileData.role !== 'editor' && profileData.role !== 'admin')) {
          router.push('/');
          return;
        }
        setProfile(profileData);
      });

      supabase.from('articles').select('*, author:profiles(*)').eq('id', articleId).single().then(({ data }) => {
        if (!data) {
          router.push('/dashboard');
          return;
        }
        setArticle(data);
        setTitle(data.title);
        setContent(data.content);
        setSummary(data.summary || '');
      });

      supabase
        .from('article_revisions')
        .select('*, editor:profiles(full_name)')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => setHistory(data || []));
    });
  }, [articleId, router]);

  const handleSave = async (publish = false) => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('articles')
      .update({
        title,
        content,
        summary: summary || generateExcerpt(content),
        status: publish ? 'published' : article.status,
        updated_at: new Date().toISOString(),
        published_at: publish ? new Date().toISOString() : article.published_at,
      })
      .eq('id', articleId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await supabase.from('article_revisions').insert({
      article_id: articleId,
      title,
      summary: summary || generateExcerpt(content),
      content,
      editor_id: user.id,
      created_at: new Date().toISOString(),
      change_summary: publish ? 'Published' : 'Updated draft',
    });

    toast({ title: 'Success', description: publish ? 'Article published!' : 'Draft saved!' });
    router.push('/dashboard');
  };

  const handleImprove = async () => {
    if (!content.trim()) return;
    setProcessing(true);
    try {
      const improved = await improveWriting(content);
      setContent(improved);
      toast({ title: 'Success', description: 'Content improved!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setProcessing(false);
  };

  const handleSummarize = async () => {
    if (!content.trim()) return;
    setProcessing(true);
    try {
      const summaryText = await summarizeArticle(content);
      setSummary(summaryText);
      toast({ title: 'Success', description: 'Summary generated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setProcessing(false);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[20px] font-semibold text-[#050505]">Edit Article</h1>
            {article && (
              <p className="text-[14px] text-[#636363]">by {article.author?.full_name || 'Unknown'}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSave.bind(null, false)} disabled={loading} className="bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]">
              Save Draft
            </Button>
            <Button onClick={handleSave.bind(null, true)} disabled={loading} className="bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a]">
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[16px] font-semibold text-[#050505]">Article Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-[14px] font-medium text-[#050505]">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="summary" className="text-[14px] font-medium text-[#050505]">Summary</Label>
                  <div className="flex gap-2 mt-1">
                    <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Article summary..." className="flex-1" rows={2} />
                    <Button type="button" variant="outline" size="sm" onClick={handleSummarize} disabled={processing || !content.trim()} className="bg-[#F7F7F7] text-[#050505] border-[rgba(5,5,5,0.1)]">
                      AI Summary
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content" className="text-[14px] font-medium text-[#050505]">Content</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handleImprove} disabled={processing || !content.trim()} className="text-[#636363] hover:bg-[rgba(5,5,5,0.05)]">
                      Improve Writing
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[500px] font-mono text-[14px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[16px] font-semibold text-[#050505]">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#636363]">Current:</span>
                  <span className={`text-[14px] font-medium px-2 py-0.5 rounded ${article?.status === 'published' ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF9C3] text-[#CA8A04]'}`}>
                    {article?.status || 'draft'}
                  </span>
                </div>
                {article?.created_at && (
                  <p className="mt-4 text-[12px] text-[#858585]">Created: {formatDate(article.created_at)}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[16px] font-semibold text-[#050505]">Revision History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {history.map((rev) => (
                      <div key={rev.id} className="border-b border-[#E5E7EB] pb-2 last:border-0">
                        <p className="text-[14px] font-medium text-[#050505]">{rev.change_summary || 'Update'}</p>
                        <p className="text-[12px] text-[#858585]">
                          {rev.editor?.full_name || 'Unknown'} - {formatDate(rev.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#636363]">No revision history</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}