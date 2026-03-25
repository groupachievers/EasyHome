import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  AuthProfileInput,
  AuthUser,
  SignUpCredentials,
  hydrateAuth,
  login as loginWithPassword,
  logout as logoutUser,
  signUp as registerUser,
  updateProfile as updateUserProfile,
} from '@/src/auth/authFunctions';

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
  signUp: (credentials: SignUpCredentials) => Promise<string | null>;
  updateProfile: (profile: AuthProfileInput) => Promise<string | null>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildProfile(user: AuthUser | null): AuthProfile | null {
  if (!user) {
    return null;
  }

  return {
    avatarUrl: user.avatarUrl,
    email: user.email,
    name: user.name,
    phone: user.phone,
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      const { user: hydratedUser } = await hydrateAuth();

      if (!isMounted) {
        return;
      }

      setUser(hydratedUser);
      setLoading(false);
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const profile = useMemo(() => buildProfile(user), [user]);
  const hasCompleteProfile = useMemo(() => isProfileComplete(profile), [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      hasCompleteProfile,
      loading,
      login: async (email, password) => {
        const { error, user: nextUser } = await loginWithPassword(email, password);

        if (!error) {
          setUser(nextUser);
        }

        return error;
      },
      logout: async () => {
        const error = await logoutUser();

        if (!error) {
          setUser(null);
        }

        return error;
      },
      profile,
      signUp: async (credentials) => {
        const { error, user: nextUser } = await registerUser(credentials);

        if (!error) {
          setUser(nextUser);
        }

        return error;
      },
      updateProfile: async (nextProfile) => {
        const { error, user: nextUser } = await updateUserProfile(nextProfile);

        if (!error) {
          setUser(nextUser);
        }

        return error;
      },
      user,
    }),
    [hasCompleteProfile, loading, profile, user]
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
