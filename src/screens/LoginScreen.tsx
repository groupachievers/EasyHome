import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import InputField from '../components/InputField';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const error = await login(email, password);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroBlock}>
            <Text style={styles.kicker}>Easyhome</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Access the rentals map, saved homes, and your menu preferences.
            </Text>
          </View>

          <View style={styles.card}>
            <InputField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <InputField
              autoComplete="password"
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              rightAdornment={
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  style={styles.passwordToggle}>
                  <MaterialIcons
                    color={palette.muted}
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={22}
                  />
                </Pressable>
              }
              secureTextEntry={!isPasswordVisible}
              value={password}
            />

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}>
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing in...' : 'Login'}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/signup' as Href)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 22,
      paddingVertical: 28,
    },
    heroBlock: {
      marginBottom: 28,
      paddingHorizontal: 6,
    },
    kicker: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 15,
      letterSpacing: 0.4,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    title: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 40,
      lineHeight: 46,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 12,
      maxWidth: 320,
    },
    card: {
      backgroundColor: palette.sheet,
      borderRadius: 32,
      padding: 22,
    },
    errorBanner: {
      backgroundColor: '#FEE2E2',
      borderRadius: 18,
      color: '#991B1B',
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.text,
      borderRadius: 22,
      marginTop: 18,
      paddingVertical: 16,
    },
    buttonDisabled: {
      opacity: 0.55,
    },
    primaryButtonText: {
      color: palette.background,
      fontFamily: Fonts.rounded,
      fontSize: 16,
    },
    secondaryButton: {
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 14,
    },
    passwordToggle: {
      alignItems: 'center',
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
  });
}
