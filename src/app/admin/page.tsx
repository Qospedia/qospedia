'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ users: 0, articles: 0, published: 0, drafts: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: profileData }) => {
        if (!profileData || profileData.role !== 'admin') {
          router.push('/');
          return;
        }
        setProfile(profileData);

        supabase.from('profiles').select('*').then(({ data: usersData }) => {
          setUsers(usersData || []);
          setStats(s => ({ ...s, users: (usersData || []).length }));
        });

        supabase.from('articles').select('status').then(({ data }) => {
          const articles = data || [];
          setStats({ articles: articles.length, published: articles.filter((a: any) => a.status === 'published').length, drafts: articles.filter((a: any) => a.status === 'draft').length, users: stats.users });
          setLoading(false);
        });
      });
    });
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Success', description: 'Role updated' });
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-[20px] font-semibold text-[#050505] mb-8">Admin Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-[#F7F7F7] p-2 rounded-lg">
                <Users className="h-5 w-5 text-[#050505]" />
              </div>
              <div>
                <p className="text-[20px] font-semibold text-[#050505]">{stats.users}</p>
                <p className="text-[14px] text-[#636363]">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-[#DBEAFE] p-2 rounded-lg">
                <FileText className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-[20px] font-semibold text-[#050505]">{stats.articles}</p>
                <p className="text-[14px] text-[#636363]">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-[#F0FDF4] p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-[20px] font-semibold text-[#050505]">{stats.published}</p>
                <p className="text-[14px] text-[#636363]">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-[#FEF9C3] p-2 rounded-lg">
                <FileText className="h-5 w-5 text-[#CA8A04]" />
              </div>
              <div>
                <p className="text-[20px] font-semibold text-[#050505]">{stats.drafts}</p>
                <p className="text-[14px] text-[#636363]">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[16px] font-semibold text-[#050505]">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-[#636363] text-[14px]">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 text-[14px] font-medium text-[#050505]">Email</th>
                      <th className="text-left py-3 px-4 text-[14px] font-medium text-[#050505]">Name</th>
                      <th className="text-left py-3 px-4 text-[14px] font-medium text-[#050505]">Role</th>
                      <th className="text-left py-3 px-4 text-[14px] font-medium text-[#050505]">Joined</th>
                      <th className="text-left py-3 px-4 text-[14px] font-medium text-[#050505]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-[#E5E7EB]">
                        <td className="py-3 px-4 text-[14px] text-[#050505]">{user.email}</td>
                        <td className="py-3 px-4 text-[14px] text-[#050505]">{user.full_name || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[12px] ${user.role === 'admin' ? 'bg-[#FEE2E2] text-[#DC2626]' : user.role === 'editor' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#F7F7F7] text-[#636363]'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#858585]">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-[14px] border border-[#E5E7EB] rounded px-2 py-1 bg-[#FCFCFC] text-[#050505]"
                          >
                            <option value="reader">Reader</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}