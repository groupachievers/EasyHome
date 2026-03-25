import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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

import InputField from '../components/InputField';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';

const PLACEHOLDER_AVATAR = require('@/assets/images/icon.png');

export default function CompleteProfileScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const { logout, profile, updateProfile } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatarUrl ?? '');
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.avatarUrl, profile?.name, profile?.phone]);

  const pickProfileImage = async () => {
    setIsPickingImage(true);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setIsPickingImage(false);
      setErrorMessage('Allow gallery access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.7,
      selectionLimit: 1,
    });

    setIsPickingImage(false);

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      setErrorMessage('The selected image could not be used. Try another photo.');
      return;
    }

    setAvatarUrl(asset.uri);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!avatarUrl.trim() || !name.trim() || !phone.trim()) {
      setErrorMessage('Profile picture, name, and phone number are required before entering the app.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const error = await updateProfile({ avatarUrl, name, phone });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const error = await logout();
    setIsLoggingOut(false);

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
            <Text style={styles.title}>Finish setup</Text>
            <Text style={styles.subtitle}>
              This account is signed in, but the required profile details are still missing.
            </Text>
          </View>

          <View style={styles.avatarPreviewWrap}>
            <Pressable onPress={pickProfileImage} style={styles.avatarPressable}>
              <Image
                contentFit="cover"
                source={avatarUrl.trim() ? { uri: avatarUrl.trim() } : PLACEHOLDER_AVATAR}
                style={styles.avatarPreview}
              />
            </Pressable>
            <Text style={styles.avatarHint}>Tap the photo or field below to pick from gallery</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{profile?.email ?? 'No email found'}</Text>
            </View>

            <Text style={styles.fieldLabel}>Profile picture</Text>
            <Pressable onPress={pickProfileImage} style={styles.imagePickerField}>
              <Text style={[styles.imagePickerText, !avatarUrl && styles.imagePickerPlaceholder]}>
                {isPickingImage
                  ? 'Opening gallery...'
                  : avatarUrl
                    ? 'Photo selected'
                    : 'Choose from gallery'}
              </Text>
            </Pressable>
            <Text style={styles.imagePickerHelper}>
              A profile picture is required before the app unlocks the signed-in experience.
            </Text>

            <InputField
              autoCapitalize="words"
              autoComplete="name"
              label="Full name"
              onChangeText={setName}
              placeholder="Amaka Okafor"
              value={name}
            />
            <InputField
              autoComplete="tel"
              keyboardType="phone-pad"
              label="Phone number"
              onChangeText={setPhone}
              placeholder="0803 123 4567"
              value={phone}
            />

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSave}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}>
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving profile...' : 'Save profile'}</Text>
            </Pressable>

            <Pressable
              disabled={isLoggingOut}
              onPress={handleLogout}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{isLoggingOut ? 'Logging out...' : 'Use another account'}</Text>
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
      paddingHorizontal: 22,
      paddingVertical: 24,
    },
    heroBlock: {
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
      maxWidth: 340,
    },
    avatarPreviewWrap: {
      alignItems: 'center',
      marginTop: 26,
      marginBottom: 22,
    },
    avatarPressable: {
      borderRadius: 44,
    },
    avatarPreview: {
      backgroundColor: palette.surface,
      borderRadius: 44,
      height: 88,
      width: 88,
    },
    avatarHint: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 10,
    },
    card: {
      backgroundColor: palette.sheet,
      borderRadius: 32,
      padding: 22,
    },
    readOnlyRow: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      marginBottom: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    readOnlyLabel: {
      color: palette.muted,
      fontFamily: Fonts.rounded,
      fontSize: 13,
      marginBottom: 8,
    },
    readOnlyValue: {
      color: palette.text,
      fontSize: 16,
    },
    fieldLabel: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 15,
      marginBottom: 10,
      marginTop: 4,
    },
    imagePickerField: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      minHeight: 56,
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    imagePickerText: {
      color: palette.text,
      fontSize: 16,
    },
    imagePickerPlaceholder: {
      color: palette.muted,
    },
    imagePickerHelper: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
      paddingHorizontal: 4,
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
  });
}
