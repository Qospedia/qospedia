import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Profile, UserRole } from './types';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile as Profile;
}

export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) {
    redirect('/auth/login');
  }
  return profile;
}

export async function requireRole(roles: UserRole[]) {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect('/');
  }
  return profile;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}