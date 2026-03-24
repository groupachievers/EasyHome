/**
 * Shared color and typography tokens for the app.
 */

import { Platform } from 'react-native';

const accentLight = '#0F766E';
const accentDark = '#5EEAD4';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F4F1EB',
    surface: '#FFFFFF',
    muted: '#6B7280',
    tint: accentLight,
    accent: accentLight,
    border: '#E7E1D7',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#111111',
    sheet: '#FFFBF5',
    shadow: '#0F172A',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    surface: '#111827',
    muted: '#94A3B8',
    tint: accentDark,
    accent: accentDark,
    border: '#1F2937',
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#F8FAFC',
    sheet: '#172033',
    shadow: '#020617',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Segoe UI', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

