'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  setProfile: () => {},
});

export function useProfile() {
  return useContext(ProfileContext);
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    }

    fetchProfile();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null);
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}