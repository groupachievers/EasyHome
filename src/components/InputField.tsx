import { ReactNode } from 'react';
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
  rightAdornment?: ReactNode;
};

export default function InputField({
  containerStyle,
  error,
  helperText,
  inputStyle,
  label,
  rightAdornment,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const isMultiline = Boolean(props.multiline);

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          isMultiline ? styles.inputShellMultiline : null,
          error ? styles.inputShellError : null,
        ]}>
        <TextInput
          keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            isMultiline ? styles.inputMultiline : null,
            rightAdornment ? styles.inputWithAdornment : null,
            inputStyle,
          ]}
          {...props}
        />
        {rightAdornment ? <View style={styles.rightAdornment}>{rightAdornment}</View> : null}
      </View>
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
    inputShell: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: 'transparent',
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
    },
    inputShellMultiline: {
      alignItems: 'flex-start',
    },
    inputShellError: {
      borderColor: '#DC2626',
    },
    input: {
      color: palette.text,
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    inputMultiline: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    inputWithAdornment: {
      paddingRight: 10,
    },
    rightAdornment: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 18,
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