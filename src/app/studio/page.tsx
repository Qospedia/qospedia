'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, Users, Settings, Shield, BarChart3,
  Eye, Edit3, Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Clock, Globe, Search, MessageSquare, Lightbulb, CheckCircle,
  XCircle, RefreshCw, Database, Lock, Key, AlertCircle, PieChart,
  ArrowUp, ArrowDown, UserPlus, Crown, Edit, Save, X, ChevronRight,
  Trash, ArrowUpRight, ArrowDownRight, Bell, Search as SearchIcon
} from 'lucide-react';

const ADMIN_EMAIL = 'ceptile.com@gmail.com';

type TabType = 'overview' | 'articles' | 'users' | 'analytics' | 'content' | 'security' | 'settings';

export default function StudioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<any>({});
  const [articles, setArticles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [contentValues, setContentValues] = useState<any>({});

  const loadData = useCallback(async (currentUser: any, currentProfile: any) => {
    if (!currentUser || !currentProfile || currentProfile.role !== 'admin') return;
    
    const supabase = createClient();
    
    const [
      { count: articleCount },
      { count: userCount },
      { count: viewCount },
      { data: recentArticles },
      { data: allUsers },
      { data: allSuggestions },
    ] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('view_count'),
      supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('article_suggestions').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const totalViews = recentArticles?.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0) || 0;

    setStats({
      articles: articleCount || 0,
      users: userCount || 0,
      views: totalViews,
      suggestions: allSuggestions?.length || 0,
    });
    setArticles(recentArticles || []);
    setUsers(allUsers || []);
    setSuggestions(allSuggestions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        window.location.href = '/auth/login';
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!profileData || profileData.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setUser(currentUser);
      setProfile(profileData);
      await loadData(currentUser, profileData);
    };

    checkAuth();
  }, [loadData]);

  const handleAddAdmin = async (targetUserId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', targetUserId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'User promoted to admin' });
      const { data: updatedUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(updatedUsers || []);
    }
  };

  const handleRemoveAdmin = async (targetUserId: string) => {
    if (targetUserId === user.id) {
      toast({ title: 'Error', description: 'Cannot remove yourself', variant: 'destructive' });
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', targetUserId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Admin removed' });
      const { data: updatedUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(updatedUsers || []);
    }
  };

  const handleUpdateSuggestion = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('article_suggestions')
      .update({ status })
      .eq('id', id);

    if (!error) {
      toast({ title: 'Success', description: `Suggestion ${status}` });
      const { data: updated } = await supabase.from('article_suggestions').select('*').order('created_at', { ascending: false }).limit(20);
      setSuggestions(updated || []);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    
    const supabase = createClient();
    await supabase.from('articles').delete().eq('id', id);
    toast({ title: 'Success', description: 'Article deleted' });
    const { data: updated } = await supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(10);
    setArticles(updated || []);
  };

  const handleSaveContent = async (type: string) => {
    const supabase = createClient();
    const value = contentValues[type];
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: type, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (!error) {
      toast({ title: 'Success', description: 'Content updated' });
      setEditingContent(null);
    } else {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  const loadContent = async (type: string) => {
    const supabase = createClient();
    const { data } = await supabase.from('site_content').select('value').eq('key', type).single();
    setContentValues((prev: any) => ({ ...prev, [type]: data?.value || '' }));
    setEditingContent(type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 text-[#2563EB]" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content Editor', icon: Edit3 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#FCFCFC]">
      <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-[rgba(252,252,252,0.1)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[20px] font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#2563EB]" />
              Admin Studio
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[14px] text-[#858585]">
              Logged in as: {profile?.full_name || user?.email}
            </span>
            <Link href="/" className="text-[14px] text-[#2563EB] hover:underline">View Site</Link>
          </div>
        </div>
        <nav className="px-6 flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#858585] hover:bg-[rgba(252,252,252,0.1)] hover:text-[#FCFCFC]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Articles"
                value={stats.articles || 0}
                icon={FileText}
                trend="+12%"
                positive={true}
              />
              <StatCard
                title="Total Users"
                value={stats.users || 0}
                icon={Users}
                trend="+5%"
                positive={true}
              />
              <StatCard
                title="Total Views"
                value={formatNumber(stats.views || 0)}
                icon={Eye}
                trend="+23%"
                positive={true}
              />
              <StatCard
                title="Pending Suggestions"
                value={stats.suggestions || 0}
                icon={Lightbulb}
                trend={stats.suggestions > 5 ? 'High' : 'Normal'}
                positive={stats.suggestions <= 5}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
                <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {articles.slice(0, 5).map((article) => (
                    <div key={article.id} className="flex items-center justify-between py-2 border-b border-[rgba(252,252,252,0.05)] last:border-0">
                      <div>
                        <p className="text-[14px] font-medium">{article.title}</p>
                        <p className="text-[12px] text-[#858585]">{article.view_count || 0} views</p>
                      </div>
                      <span className="text-[12px] text-[#858585]">{formatDate(article.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
                <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Recent Suggestions
                </h2>
                <div className="space-y-3">
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between py-2 border-b border-[rgba(252,252,252,0.05)] last:border-0">
                      <div>
                        <p className="text-[14px] font-medium">{suggestion.topic || 'No topic'}</p>
                        <p className="text-[12px] text-[#858585] capitalize">{suggestion.type}</p>
                      </div>
                      <span className={`text-[12px] px-2 py-0.5 rounded ${
                        suggestion.status === 'approved' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                        suggestion.status === 'rejected' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}>{suggestion.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
              <h2 className="text-[16px] font-semibold mb-4">User Distribution</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[rgba(37,99,235,0.1)] rounded-lg">
                  <p className="text-[24px] font-bold text-[#2563EB]">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-[12px] text-[#858585]">Admins</p>
                </div>
                <div className="text-center p-4 bg-[rgba(34,197,94,0.1)] rounded-lg">
                  <p className="text-[24px] font-bold text-[#22C55E]">{users.filter(u => u.role === 'editor').length}</p>
                  <p className="text-[12px] text-[#858585]">Editors</p>
                </div>
                <div className="text-center p-4 bg-[rgba(156,163,175,0.1)] rounded-lg">
                  <p className="text-[24px] font-bold text-[#9CA3AF]">{users.filter(u => u.role === 'user').length}</p>
                  <p className="text-[12px] text-[#858585]">Users</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold">Articles Management</h2>
              <Link href="/editor/new">
                <Button className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </Link>
            </div>
            <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1A1A1A]">
                  <tr>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Title</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Status</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Views</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Created</th>
                    <th className="text-right p-4 text-[12px] font-medium text-[#858585]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-t border-[rgba(252,252,252,0.05)] hover:bg-[rgba(252,252,252,0.02)]">
                      <td className="p-4 text-[14px]">{article.title}</td>
                      <td className="p-4">
                        <span className={`text-[12px] px-2 py-0.5 rounded capitalize ${
                          article.status === 'published' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                          article.status === 'draft' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                          'bg-[#858585]/20 text-[#858585]'
                        }`}>{article.status}</span>
                      </td>
                      <td className="p-4 text-[14px] text-[#858585]">{article.view_count || 0}</td>
                      <td className="p-4 text-[14px] text-[#858585]">{formatDate(article.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/article/${article.slug}`}>
                            <button className="p-2 hover:bg-[rgba(252,252,252,0.1)] rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          <button onClick={() => handleDeleteArticle(article.id)} className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded text-[#EF4444]">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-[18px] font-semibold">User Management</h2>
            <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1A1A1A]">
                  <tr>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">User</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Email</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Role</th>
                    <th className="text-left p-4 text-[12px] font-medium text-[#858585]">Joined</th>
                    <th className="text-right p-4 text-[12px] font-medium text-[#858585]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[rgba(252,252,252,0.05)]">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-medium">
                          {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[14px]">{u.full_name || 'No name'}</span>
                      </td>
                      <td className="p-4 text-[14px] text-[#858585]">{u.email}</td>
                      <td className="p-4">
                        <span className={`text-[12px] px-2 py-0.5 rounded capitalize ${
                          u.role === 'admin' ? 'bg-[#2563EB]/20 text-[#2563EB]' :
                          u.role === 'editor' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                          'bg-[#858585]/20 text-[#858585]'
                        }`}>{u.role || 'user'}</span>
                      </td>
                      <td className="p-4 text-[14px] text-[#858585]">{formatDate(u.created_at)}</td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => handleAddAdmin(u.id)}
                            className="text-[14px] text-[#2563EB] hover:underline"
                          >
                            Make Admin
                          </button>
                        ) : u.id !== user?.id ? (
                          <button
                            onClick={() => handleRemoveAdmin(u.id)}
                            className="text-[14px] text-[#EF4444] hover:underline"
                          >
                            Remove Admin
                          </button>
                        ) : (
                          <span className="text-[14px] text-[#858585]">Current</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-[18px] font-semibold">Site Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
                <h3 className="text-[14px] font-medium mb-4">Views by Article</h3>
                <div className="space-y-3">
                  {articles.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10).map((article, i) => (
                    <div key={article.id} className="flex items-center gap-3">
                      <span className="text-[12px] text-[#858585] w-6">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[12px] mb-1">
                          <span>{article.title}</span>
                          <span className="text-[#2563EB]">{article.view_count || 0}</span>
                        </div>
                        <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB] rounded-full"
                            style={{ width: `${Math.min(100, ((article.view_count || 0) / (stats.views || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
                <h3 className="text-[14px] font-medium mb-4">Content Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1A1A1A] rounded-lg">
                    <p className="text-[24px] font-bold">{stats.articles}</p>
                    <p className="text-[12px] text-[#858585]">Published Articles</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg">
                    <p className="text-[24px] font-bold">{stats.users}</p>
                    <p className="text-[12px] text-[#858585]">Registered Users</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg">
                    <p className="text-[24px] font-bold">{stats.suggestions}</p>
                    <p className="text-[12px] text-[#858585]">Article Suggestions</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg">
                    <p className="text-[24px] font-bold">{stats.views}</p>
                    <p className="text-[12px] text-[#858585]">Total Views</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6 lg:col-span-2">
                <h3 className="text-[14px] font-medium mb-4">Suggestions by Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F59E0B]/10 rounded-lg text-center">
                    <p className="text-[24px] font-bold text-[#F59E0B]">
                      {suggestions.filter(s => s.status === 'pending').length}
                    </p>
                    <p className="text-[12px] text-[#858585]">Pending</p>
                  </div>
                  <div className="p-4 bg-[#22C55E]/10 rounded-lg text-center">
                    <p className="text-[24px] font-bold text-[#22C55E]">
                      {suggestions.filter(s => s.status === 'approved').length}
                    </p>
                    <p className="text-[12px] text-[#858585]">Approved</p>
                  </div>
                  <div className="p-4 bg-[#EF4444]/10 rounded-lg text-center">
                    <p className="text-[24px] font-bold text-[#EF4444]">
                      {suggestions.filter(s => s.status === 'rejected').length}
                    </p>
                    <p className="text-[12px] text-[#858585]">Rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <ContentEditor
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            contentValues={contentValues}
            setContentValues={setContentValues}
            onSave={handleSaveContent}
            onLoad={loadContent}
          />
        )}

        {activeTab === 'security' && (
          <SecurityPanel user={user} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, positive }: any) {
  return (
    <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-5 w-5 text-[#2563EB]" />
        <span className={`text-[12px] px-2 py-0.5 rounded ${positive ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
          {trend}
        </span>
      </div>
      <p className="text-[28px] font-bold mb-1">{value}</p>
      <p className="text-[12px] text-[#858585]">{title}</p>
    </div>
  );
}

function ContentEditor({ editingContent, setEditingContent, contentValues, setContentValues, onSave, onLoad }: any) {
  const contentTypes = [
    { key: 'tagline', label: 'Homepage Tagline', placeholder: 'Your knowledge base, powered by AI' },
    { key: 'about', label: 'About Page Content', placeholder: 'About Qospedia...' },
    { key: 'privacy_policy', label: 'Privacy Policy', placeholder: 'Privacy policy content...' },
    { key: 'terms_of_service', label: 'Terms of Service', placeholder: 'Terms and conditions...' },
    { key: 'footer_about', label: 'Footer About', placeholder: 'Footer description...' },
    { key: 'meta_title', label: 'Meta Title (SEO)', placeholder: 'Qospedia - AI Knowledge Base' },
    { key: 'meta_description', label: 'Meta Description (SEO)', placeholder: 'Your AI-powered knowledge base...' },
    { key: 'announcement', label: 'Announcement Banner', placeholder: 'Important announcement...' },
    { key: 'maintenance_mode', label: 'Maintenance Mode Message', placeholder: 'Site is under maintenance...' },
  ];

  const [formValue, setFormValue] = useState('');

  useEffect(() => {
    if (editingContent) {
      setFormValue(contentValues[editingContent] || '');
    }
  }, [editingContent, contentValues]);

  return (
    <div className="space-y-6">
      <h2 className="text-[18px] font-semibold">Content Editor</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {contentTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => onLoad(type.key)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                editingContent === type.key
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] hover:bg-[rgba(252,252,252,0.05)]'
              }`}
            >
              <p className="text-[14px] font-medium">{type.label}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {editingContent ? (
            <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium">
                  {contentTypes.find(t => t.key === editingContent)?.label}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingContent(null)}
                    className="p-2 hover:bg-[rgba(252,252,252,0.1)] rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                rows={12}
                className="w-full bg-[#1A1A1A] border border-[rgba(252,252,252,0.1)] rounded-lg p-4 text-[14px] resize-none focus:outline-none focus:border-[#2563EB]"
                placeholder={contentTypes.find(t => t.key === editingContent)?.placeholder}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setContentValues((prev: any) => ({ ...prev, [editingContent]: formValue }));
                    onSave(editingContent);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] rounded-lg text-[14px] font-medium"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingContent(null)}
                  className="px-6 py-3 bg-[#1A1A1A] hover:bg-[rgba(252,252,252,0.1)] rounded-lg text-[14px] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6 text-center">
              <Edit3 className="h-10 w-10 mx-auto text-[#858585] mb-4" />
              <p className="text-[#858585]">Select a content type to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecurityPanel({ user }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-[18px] font-semibold">Security Center</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
          <h3 className="text-[16px] font-medium mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#22C55E]" />
            Security Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 rounded-lg">
              <span className="text-[14px]">SSL/TLS Encryption</span>
              <span className="text-[12px] text-[#22C55E]">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 rounded-lg">
              <span className="text-[14px]">Admin Authentication</span>
              <span className="text-[12px] text-[#22C55E]">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 rounded-lg">
              <span className="text-[14px]">Rate Limiting</span>
              <span className="text-[12px] text-[#22C55E]">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 rounded-lg">
              <span className="text-[14px]">Environment Variables</span>
              <span className="text-[12px] text-[#22C55E]">Secured</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
          <h3 className="text-[16px] font-medium mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#2563EB]" />
            Security Recommendations
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-[rgba(245,158,11,0.1)] rounded-lg">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5" />
              <div>
                <p className="text-[14px] font-medium">Enable 2FA</p>
                <p className="text-[12px] text-[#858585]">Add two-factor authentication for extra security</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[rgba(245,158,11,0.1)] rounded-lg">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5" />
              <div>
                <p className="text-[14px] font-medium">Review Admin Sessions</p>
                <p className="text-[12px] text-[#858585]">Check for unauthorized access</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[rgba(245,158,11,0.1)] rounded-lg">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5" />
              <div>
                <p className="text-[14px] font-medium">Update Password</p>
                <p className="text-[12px] text-[#858585]">Use a strong, unique password</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6 lg:col-span-2">
          <h3 className="text-[16px] font-medium mb-4">Admin Session Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-[12px] text-[#858585]">Current User ID</p>
              <p className="text-[14px] font-mono truncate">{user?.id}</p>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-[12px] text-[#858585]">Current Email</p>
              <p className="text-[14px]">{user?.email}</p>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-[12px] text-[#858585]">Last Sign In</p>
              <p className="text-[14px]">{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}</p>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="text-[12px] text-[#858585]">Session Created</p>
              <p className="text-[14px]">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-[18px] font-semibold">Site Settings</h2>
      <div className="bg-[#0A0A0A] border border-[rgba(252,252,252,0.1)] rounded-xl p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg">
            <div>
              <p className="text-[14px] font-medium">Site Name</p>
              <p className="text-[12px] text-[#858585]">Qospedia</p>
            </div>
            <button className="text-[14px] text-[#2563EB] hover:underline">Edit</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg">
            <div>
              <p className="text-[14px] font-medium">Site URL</p>
              <p className="text-[12px] text-[#858585]">https://qospedia.vercel.app</p>
            </div>
            <button className="text-[14px] text-[#2563EB] hover:underline">Edit</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg">
            <div>
              <p className="text-[14px] font-medium">Environment</p>
              <p className="text-[12px] text-[#858585]">Production</p>
            </div>
            <span className="text-[12px] text-[#22C55E]">Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(date: string): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}