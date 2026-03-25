import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ACCOUNTS_STORAGE_KEY = 'easyhome.auth.accounts';
const AUTH_ACTIVE_USER_STORAGE_KEY = 'easyhome.auth.active-user-id';

export type AuthProfileInput = {
  avatarUrl: string;
  name: string;
  phone: string;
};

export type SignUpCredentials = AuthProfileInput & {
  email: string;
  password: string;
};

type StoredAuthUser = AuthProfileInput & {
  email: string;
  id: string;
  password: string;
};

export type AuthUser = Omit<StoredAuthUser, 'password'>;

export type AuthResponse = {
  error: string | null;
  user: AuthUser | null;
};

function normalize(value: string) {
  return value.trim();
}

function normalizeEmail(email: string) {
  return normalize(email).toLowerCase();
}

function getUnexpectedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while handling your account on this device. Try again.';
}

function buildUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeUser({ password: _password, ...user }: StoredAuthUser): AuthUser {
  return user;
}

async function readStoredUsers() {
  const rawValue = await AsyncStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);

  if (!rawValue) {
    return [] as StoredAuthUser[];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      await AsyncStorage.removeItem(AUTH_ACCOUNTS_STORAGE_KEY);
      return [] as StoredAuthUser[];
    }

    return parsedValue.filter(
      (entry): entry is StoredAuthUser =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.avatarUrl === 'string' &&
        typeof entry.email === 'string' &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.password === 'string' &&
        typeof entry.phone === 'string'
    );
  } catch {
    await AsyncStorage.removeItem(AUTH_ACCOUNTS_STORAGE_KEY);
    return [] as StoredAuthUser[];
  }
}

async function writeStoredUsers(users: StoredAuthUser[]) {
  await AsyncStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
}

async function setActiveUserId(userId: string | null) {
  if (!userId) {
    await AsyncStorage.removeItem(AUTH_ACTIVE_USER_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(AUTH_ACTIVE_USER_STORAGE_KEY, userId);
}

async function getActiveUserRecord() {
  const [activeUserId, users] = await Promise.all([
    AsyncStorage.getItem(AUTH_ACTIVE_USER_STORAGE_KEY),
    readStoredUsers(),
  ]);

  if (!activeUserId) {
    return null;
  }

  const activeUser = users.find((user) => user.id === activeUserId) ?? null;

  if (!activeUser) {
    await setActiveUserId(null);
  }

  return activeUser;
}

export async function hydrateAuth(): Promise<AuthResponse> {
  try {
    const activeUser = await getActiveUserRecord();

    return {
      error: null,
      user: activeUser ? sanitizeUser(activeUser) : null,
    };
  } catch (error) {
    return {
      error: getUnexpectedErrorMessage(error),
      user: null,
    };
  }
}

export async function signUp({
  avatarUrl,
  email,
  name,
  password,
  phone,
}: SignUpCredentials): Promise<AuthResponse> {
  try {
    const users = await readStoredUsers();
    const normalizedEmail = normalizeEmail(email);
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return {
        error: 'An account with this email already exists.',
        user: null,
      };
    }

    const nextUser: StoredAuthUser = {
      avatarUrl: normalize(avatarUrl),
      email: normalizedEmail,
      id: buildUserId(),
      name: normalize(name),
      password,
      phone: normalize(phone),
    };

    const nextUsers = [...users, nextUser];

    await writeStoredUsers(nextUsers);
    await setActiveUserId(nextUser.id);

    return {
      error: null,
      user: sanitizeUser(nextUser),
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
    const users = await readStoredUsers();
    const normalizedEmail = normalizeEmail(email);
    const matchingUser = users.find((user) => user.email === normalizedEmail) ?? null;

    if (!matchingUser || matchingUser.password !== password) {
      return {
        error: 'Incorrect email or password.',
        user: null,
      };
    }

    await setActiveUserId(matchingUser.id);

    return {
      error: null,
      user: sanitizeUser(matchingUser),
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
    const activeUserId = await AsyncStorage.getItem(AUTH_ACTIVE_USER_STORAGE_KEY);

    if (!activeUserId) {
      return {
        error: 'No signed-in account was found.',
        user: null,
      };
    }

    const users = await readStoredUsers();
    const userIndex = users.findIndex((user) => user.id === activeUserId);

    if (userIndex === -1) {
      await setActiveUserId(null);

      return {
        error: 'No signed-in account was found.',
        user: null,
      };
    }

    const updatedUser: StoredAuthUser = {
      ...users[userIndex],
      avatarUrl: normalize(avatarUrl),
      name: normalize(name),
      phone: normalize(phone),
    };

    const nextUsers = [...users];
    nextUsers[userIndex] = updatedUser;
    await writeStoredUsers(nextUsers);

    return {
      error: null,
      user: sanitizeUser(updatedUser),
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
    await setActiveUserId(null);
    return null;
  } catch (error) {
    return getUnexpectedErrorMessage(error);
  }
}
