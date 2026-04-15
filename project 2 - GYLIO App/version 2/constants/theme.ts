import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#050506',
    surface: '#101011',
    surfaceRaised: '#171719',
    surfaceSoft: '#202023',
    text: '#F7F7F2',
    textMuted: '#A3A3A0',
    textDim: '#6F7070',
    border: '#2A2B2D',
    accent: '#B7C0C7',
    danger: '#C36B6B',
    success: '#A8BFA2'
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 34,
    xxl: 48
  },
  radius: {
    sm: 6,
    md: 8
  },
  typography: {
    brand: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'system' }),
    body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'system' })
  }
} as const;

export const sectionTitle = {
  color: theme.colors.text,
  fontFamily: theme.typography.brand,
  fontSize: 14,
  fontWeight: '700' as const,
  letterSpacing: 0,
  textTransform: 'uppercase' as const
};
