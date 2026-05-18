'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { 
  User, Shield, Clock, Database, Cookie, Download, Trash2, 
  ChevronRight, Key, Smartphone, Globe, MapPin, Calendar,
  Check, X, Eye, EyeOff, Trash
} from 'lucide-react';

interface Session {
  id: string;
  created_at: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [activeTab, setActiveTab] = useState('account');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(data.user);
      
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
        }
        setLoading(false);
      });
    });
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ 
      full_name: fullName,
      updated_at: new Date().toISOString()
    }).eq('id', profile.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setProfile({ ...profile, full_name: fullName });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.email) {
      toast({ title: 'Error', description: 'Email does not match', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase.auth.signOut();
      toast({ title: 'Account Deleted', description: 'Redirecting...' });
      setTimeout(() => router.push('/'), 2000);
    }
    setLoading(false);
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFCFC] dark:bg-[#050505]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#636363] dark:text-[#858585]">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    { id: 'data', label: 'Your Data', icon: Database },
  ];

  return (
    <div className="min-h-screen py-8 px-4 bg-[#FCFCFC] dark:bg-[#050505]">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-[28px] font-semibold text-[#050505] dark:text-[#FCFCFC] mb-8">Settings</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505]' 
                      : 'text-[#636363] dark:text-[#858585] hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 space-y-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Manage your account information</CardTitle>
                    <CardDescription className="text-[#636363] dark:text-[#858585]">Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xl font-semibold">
                          {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">{profile?.full_name || 'No name set'}</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">{profile?.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="fullName" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Full Name</Label>
                          <Input 
                            id="fullName" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]"
                          />
                        </div>
                        <div>
                          <Label className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Email</Label>
                          <Input 
                            value={profile?.email || ''} 
                            disabled 
                            className="mt-1.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#636363] dark:text-[#858585]"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Role</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585] capitalize">{profile?.role || 'user'}</p>
                        </div>
                        <Badge variant="secondary" className="bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#636363] dark:text-[#858585]">
                          {profile?.role || 'user'}
                        </Badge>
                      </div>
                      
                      <Separator className="bg-[#E5E7EB] dark:bg-[rgba(252,252,252,0.1)]" />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Account created</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Sign-in methods</CardTitle>
                    <CardDescription className="text-[#636363] dark:text-[#858585]">Manage your ways of logging into Qospedia</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Email and password</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">{profile?.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.2)] text-[#22C55E]">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Login with password</CardTitle>
                    <CardDescription className="text-[#636363] dark:text-[#858585]">Manage the password for your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <Label htmlFor="newPassword" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">New Password</Label>
                        <div className="relative mt-1.5">
                          <Input 
                            id="newPassword" 
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pr-10 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858585] dark:text-[#636363] hover:text-[#050505] dark:hover:text-[#FCFCFC]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Confirm Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="mt-1.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] text-[#050505] dark:text-[#FCFCFC]"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading || !newPassword || !confirmPassword}
                        className="bg-[#050505] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#050505] hover:bg-[#1a1a1a] dark:hover:bg-[#E5E7EB]"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Multi-factor authentication</CardTitle>
                    <CardDescription className="text-[#636363] dark:text-[#858585]">Secure your account with a second factor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-[#636363] dark:text-[#858585]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Authenticator app</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">Use an authenticator app to get codes</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                        Enable MFA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'sessions' && (
              <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                <CardHeader>
                  <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Your sessions</CardTitle>
                  <CardDescription className="text-[#636363] dark:text-[#858585]">Manage your active browser sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-[#2563EB]" />
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Current session</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">This is your current device</p>
                        </div>
                      </div>
                      <Badge className="bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.2)] text-[#22C55E]">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px] text-[#636363] dark:text-[#858585]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Faridabad, Haryana</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        <span>IN (Asia/Kolkata)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Current</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 text-[#636363] dark:text-[#858585]">
                    <p className="text-[14px]">No other active sessions found.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)] bg-[#FCFCFC] dark:bg-[#0A0A0A]">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-[#050505] dark:text-[#FCFCFC]">Your data</CardTitle>
                    <CardDescription className="text-[#636363] dark:text-[#858585]">Manage your personal data stored with Qospedia</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#F7F7F7] dark:bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-[#636363] dark:text-[#858585]" />
                        <div>
                          <p className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Download account data</p>
                          <p className="text-[13px] text-[#636363] dark:text-[#858585]">Download all your data in JSON format</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-[#E5E7EB] dark:border-[rgba(252,252,252,0.1)]">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Trash className="h-5 w-5" />
                      Delete account
                    </CardTitle>
                    <CardDescription className="text-red-600/80 dark:text-red-400/80">
                      Permanently delete your account and all associated data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white dark:bg-[#1A1A1A] rounded-lg space-y-3">
                      <p className="text-[14px] text-[#050505] dark:text-[#FCFCFC]">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                      <div>
                        <Label className="text-[14px] font-medium text-[#050505] dark:text-[#FCFCFC]">Type your email to confirm: {user?.email}</Label>
                        <Input 
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder={user?.email}
                          className="mt-1.5 bg-white dark:bg-[#1A1A1A] border-red-200 dark:border-red-900/50 text-[#050505] dark:text-[#FCFCFC]"
                        />
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== user?.email || loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}