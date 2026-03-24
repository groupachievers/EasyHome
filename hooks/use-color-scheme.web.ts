import { useAppPreferences } from '@/context/app-preferences';

export function useColorScheme() {
  return useAppPreferences().colorScheme;
}

