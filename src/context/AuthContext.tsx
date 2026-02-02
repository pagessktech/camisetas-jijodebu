import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: User) => {
    try {
      // Use maybeSingle to prevent error if row is missing
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
      } else {
        // Fallback: If profile doesn't exist (e.g. trigger failed), create it manually
        console.warn('Profile missing, attempting fallback creation...');
        const newProfile = {
            id: currentUser.id,
            email: currentUser.email || '', // Added email here
            full_name: currentUser.user_metadata?.full_name || 'User',
            avatar_url: currentUser.user_metadata?.avatar_url || '',
            role: 'customer'
        };
        
        const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
        
        if (!insertError) {
             setProfile(newProfile as UserProfile);
        } else {
            console.error('Failed to create fallback profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // State updates handled by onAuthStateChange
  };

  // Check if role is admin (safely check property, assuming 'role' is in profile)
  const isAdmin = (profile as any)?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};