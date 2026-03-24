import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ColorSchemeName, useColorScheme as useNativeColorScheme } from 'react-native';

export type ThemePreference = 'default' | 'light' | 'dark';

type AppPreferencesContextValue = {
  colorScheme: NonNullable<ColorSchemeName>;
  favorites: string[];
  isFavorite: (homeId: string) => boolean;
  setThemePreference: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
  toggleFavorite: (homeId: string) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const nativeColorScheme = useNativeColorScheme() ?? 'light';
  const [themePreference, setThemePreference] = useState<ThemePreference>('default');
  const [favorites, setFavorites] = useState<string[]>([]);

  const colorScheme = themePreference === 'default' ? nativeColorScheme : themePreference;

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      colorScheme,
      favorites,
      isFavorite: (homeId) => favorites.includes(homeId),
      setThemePreference,
      themePreference,
      toggleFavorite: (homeId) => {
        setFavorites((currentFavorites) =>
          currentFavorites.includes(homeId)
            ? currentFavorites.filter((id) => id !== homeId)
            : [...currentFavorites, homeId]
        );
      },
    }),
    [colorScheme, favorites, themePreference]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider.');
  }

  return context;
}

