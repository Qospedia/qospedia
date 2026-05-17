'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Clock, Eye } from 'lucide-react';
import { formatDate, generateExcerpt } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        supabase
          .from('articles')
          .select('*')
          .eq('author_id', data.user.id)
          .order('updated_at', { ascending: false })
          .then(({ data }) => {
            setArticles(data || []);
            setLoading(false);
          });
      });
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setArticles(articles.filter(a => a.id !== id));
      toast({ title: 'Success', description: 'Article deleted' });
    }
  };

  if (!profile) return null;

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.full_name || profile.email}</p>
          </div>
          <Link href="/editor/new">
            <Button variant="accent">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <Link href={`/article/${article.slug}`} className="font-medium text-foreground hover:text-accent">
                        {article.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded text-xs ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {article.status}
                        </span>
                        <span>{article.view_count} views</span>
                        <span>Updated {formatDate(article.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/editor/${article.id}`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)} className="text-destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No articles yet. Create your first!</p>
                <Link href="/editor/new">
                  <Button className="mt-4">Create Article</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}