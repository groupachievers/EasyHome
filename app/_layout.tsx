import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { AppPreferencesProvider, useAppPreferences } from '@/context/app-preferences';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Colors, Fonts } from '@/constants/theme';

function RootNavigator() {
  const { colorScheme } = useAppPreferences();
  const { hasCompleteProfile, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const inAuthGroup = segments[0] === '(auth)';
  const onProfileScreen = inAuthGroup && segments[1] === 'profile';
  const segmentKey = segments.join('/');

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      if (!inAuthGroup || onProfileScreen) {
        router.replace('/login' as Href);
      }
      return;
    }

    if (!hasCompleteProfile) {
      if (!onProfileScreen) {
        router.replace('/profile' as Href);
      }
      return;
    }

    if (inAuthGroup) {
      router.replace('/' as Href);
    }
  }, [hasCompleteProfile, inAuthGroup, loading, onProfileScreen, router, segmentKey, user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={styles.loadingTitle}>Easyhome</Text>
          <Text style={styles.loadingSubtitle}>Loading your account...</Text>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="payment/[homeId]"
            options={{
              animation: 'fade',
              contentStyle: { backgroundColor: 'transparent' },
              gestureEnabled: true,
              presentation: 'transparentModal',
            }}
          />
        </Stack>
      )}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppPreferencesProvider>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    loadingScreen: {
      alignItems: 'center',
      backgroundColor: palette.background,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    loadingTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 28,
      marginTop: 18,
    },
    loadingSubtitle: {
      color: palette.muted,
      fontSize: 14,
      marginTop: 8,
    },
  });
}