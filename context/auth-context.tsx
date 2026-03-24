import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

import {
  AuthProfileInput,
  SignUpCredentials,
  login as loginWithPassword,
  logout as logoutUser,
  signUp as registerUser,
  updateProfile as updateUserProfile,
} from '@/src/auth/authFunctions';
import { supabase } from '@/src/api/supabaseClient';

export type AuthProfile = {
  avatarUrl: string;
  email: string;
  name: string;
  phone: string;
};

type AuthContextValue = {
  hasCompleteProfile: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<string | null>;
  profile: AuthProfile | null;
  session: Session | null;
  signUp: (credentials: SignUpCredentials) => Promise<string | null>;
  updateProfile: (profile: AuthProfileInput) => Promise<string | null>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getMetadataValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function buildProfile(user: User | null): AuthProfile | null {
  if (!user) {
    return null;
  }

  return {
    avatarUrl: getMetadataValue(user.user_metadata?.avatar_url),
    email: user.email ?? '',
    name: getMetadataValue(user.user_metadata?.full_name),
    phone: getMetadataValue(user.user_metadata?.phone),
  };
}

function isProfileComplete(profile: AuthProfile | null) {
  return Boolean(
    profile?.avatarUrl.trim() &&
      profile?.email.trim() &&
      profile?.name.trim() &&
      profile?.phone.trim()
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const profile = useMemo(() => buildProfile(user), [user]);
  const hasCompleteProfile = useMemo(() => isProfileComplete(profile), [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      hasCompleteProfile,
      loading,
      login: async (email, password) => {
        const { error } = await loginWithPassword(email, password);
        return error;
      },
      logout: async () => logoutUser(),
      profile,
      session,
      signUp: async (credentials) => {
        const { error } = await registerUser(credentials);
        return error;
      },
      updateProfile: async (nextProfile) => {
        const { error } = await updateUserProfile(nextProfile);
        return error;
      },
      user,
    }),
    [hasCompleteProfile, loading, profile, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
