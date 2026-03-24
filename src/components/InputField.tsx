import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  helperText?: string;
  inputStyle?: StyleProp<TextStyle>;
  label: string;
};

export default function InputField({
  containerStyle,
  error,
  helperText,
  inputStyle,
  label,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
        placeholderTextColor={palette.muted}
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        {...props}
      />
      {error || helperText ? (
        <Text style={[styles.helperText, error ? styles.errorText : null]}>
          {error ?? helperText}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    label: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 15,
      marginBottom: 10,
      marginTop: 4,
    },
    input: {
      backgroundColor: palette.surface,
      borderColor: 'transparent',
      borderRadius: 24,
      borderWidth: 1,
      color: palette.text,
      fontSize: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    inputError: {
      borderColor: '#DC2626',
    },
    helperText: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    errorText: {
      color: '#DC2626',
    },
  });
}
