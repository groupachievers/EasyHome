import { AuthError, User } from '@supabase/supabase-js';

import { supabase } from '../api/supabaseClient';

export type AuthProfileInput = {
  avatarUrl: string;
  name: string;
  phone: string;
};

export type SignUpCredentials = AuthProfileInput & {
  email: string;
  password: string;
};

export type AuthResponse = {
  error: string | null;
  user: User | null;
};

function normalize(value: string) {
  return value.trim();
}

function getErrorMessage(error: AuthError | Error | null) {
  return error ? error.message : null;
}

function getUnexpectedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while talking to Supabase. Check your connection and try again.';
}

export async function signUp({
  avatarUrl,
  email,
  name,
  password,
  phone,
}: SignUpCredentials): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalize(email),
      password,
      options: {
        data: {
          avatar_url: normalize(avatarUrl),
          full_name: normalize(name),
          phone: normalize(phone),
        },
      },
    });

    return {
      error: getErrorMessage(error),
      user: data.user,
    };
  } catch (error) {
    return {
      error: getUnexpectedErrorMessage(error),
      user: null,
    };
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalize(email),
      password,
    });

    return {
      error: getErrorMessage(error),
      user: data.user,
    };
  } catch (error) {
    return {
      error: getUnexpectedErrorMessage(error),
      user: null,
    };
  }
}

export async function updateProfile({ avatarUrl, name, phone }: AuthProfileInput): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        avatar_url: normalize(avatarUrl),
        full_name: normalize(name),
        phone: normalize(phone),
      },
    });

    return {
      error: getErrorMessage(error),
      user: data.user,
    };
  } catch (error) {
    return {
      error: getUnexpectedErrorMessage(error),
      user: null,
    };
  }
}

export async function logout(): Promise<string | null> {
  try {
    const { error } = await supabase.auth.signOut();
    return getErrorMessage(error);
  } catch (error) {
    return getUnexpectedErrorMessage(error);
  }
}
