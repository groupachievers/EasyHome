import { Image } from 'expo-image';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppPreferences, ThemePreference } from '@/context/app-preferences';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];
const PLACEHOLDER_AVATAR = require('@/assets/images/icon.png');

type PreferenceRowProps = {
  destructive?: boolean;
  label: string;
  noBorder?: boolean;
  onPress?: () => void;
  value?: string;
  valueElement?: ReactNode;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const { colorScheme: resolvedTheme, setThemePreference, themePreference } = useAppPreferences();
  const { logout, profile } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setErrorMessage(null);

    const error = await logout();

    setIsLoggingOut(false);

    if (error) {
      setErrorMessage(error);
    }
  };

  const themeLabel =
    themePreference === 'default'
      ? `Default (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
      : themePreference === 'dark'
        ? 'Dark'
        : 'Light';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Menu</Text>

        <View style={styles.heroCard}>
          <Image
            contentFit="cover"
            source={profile?.avatarUrl ? { uri: profile.avatarUrl } : PLACEHOLDER_AVATAR}
            style={styles.heroAvatar}
          />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroName}>{profile?.name ?? 'Guest user'}</Text>
            <Text style={styles.heroEmail}>{profile?.email ?? 'No email available'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <PreferenceRow
            label="Picture"
            noBorder
            valueElement={
              <Image
                contentFit="cover"
                source={profile?.avatarUrl ? { uri: profile.avatarUrl } : PLACEHOLDER_AVATAR}
                style={styles.inlineAvatar}
              />
            }
          />
          <PreferenceRow label="Name" value={profile?.name ?? 'Required'} />
          <PreferenceRow label="Phone number" value={profile?.phone ?? 'Required'} />
          <PreferenceRow label="Email" value={profile?.email ?? 'Required'} />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.sectionCard}>
          <PreferenceRow label="Theme" noBorder value={themeLabel} />
          <View style={styles.themeSelector}>
            {THEME_OPTIONS.map((option) => {
              const selected = themePreference === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  style={[styles.themeChip, selected && styles.themeChipSelected]}>
                  <Text style={[styles.themeChipText, selected && styles.themeChipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PreferenceRow
            destructive
            label={isLoggingOut ? 'Logging out...' : 'Log out'}
            onPress={handleLogout}
            value=""
          />
        </View>

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({
  destructive = false,
  label,
  noBorder = false,
  onPress,
  value,
  valueElement,
}: PreferenceRowProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const content = (
    <View style={[styles.row, noBorder && styles.rowNoBorder]}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      {valueElement ?? <Text style={styles.rowValue}>{value}</Text>}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingBottom: 32,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    title: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 36,
      lineHeight: 42,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
      maxWidth: 340,
    },
    heroCard: {
      alignItems: 'center',
      backgroundColor: palette.sheet,
      borderRadius: 32,
      flexDirection: 'row',
      marginTop: 24,
      padding: 20,
    },
    heroAvatar: {
      backgroundColor: palette.surface,
      borderRadius: 34,
      height: 68,
      width: 68,
    },
    heroTextWrap: {
      flex: 1,
      marginLeft: 16,
    },
    heroName: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 24,
      lineHeight: 28,
    },
    heroEmail: {
      color: palette.muted,
      fontSize: 14,
      marginTop: 6,
    },
    sectionLabel: {
      color: palette.muted,
      fontFamily: Fonts.rounded,
      fontSize: 13,
      letterSpacing: 0.4,
      marginBottom: 12,
      marginTop: 28,
      textTransform: 'uppercase',
    },
    sectionCard: {
      backgroundColor: palette.sheet,
      borderRadius: 32,
      overflow: 'hidden',
      paddingHorizontal: 20,
    },
    row: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 66,
      paddingVertical: 8,
    },
    rowNoBorder: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 16,
      maxWidth: '55%',
    },
    rowLabelDestructive: {
      color: '#DC2626',
    },
    rowValue: {
      color: palette.muted,
      fontSize: 14,
      maxWidth: '45%',
      textAlign: 'right',
    },
    inlineAvatar: {
      backgroundColor: palette.surface,
      borderRadius: 22,
      height: 44,
      width: 44,
    },
    themeSelector: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
      marginTop: 4,
      paddingBottom: 16,
    },
    themeChip: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 20,
      flex: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 12,
    },
    themeChipSelected: {
      backgroundColor: palette.text,
    },
    themeChipText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 14,
    },
    themeChipTextSelected: {
      color: palette.background,
    },
    errorBanner: {
      backgroundColor: '#FEE2E2',
      borderRadius: 18,
      color: '#991B1B',
      fontSize: 13,
      lineHeight: 20,
      marginTop: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
  });
}
