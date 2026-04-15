import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'system-ui'
});

const displayFamily = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  default: 'system-ui'
});

export const theme = {
  colors: {
    background: '#111214',
    backgroundDeep: '#0D0E10',
    surface: '#181A1D',
    surfaceRaised: '#202328',
    surfaceGlass: 'rgba(32,35,40,0.72)',
    text: '#ECEFF1',
    text72: 'rgba(236,239,241,0.72)',
    text48: 'rgba(236,239,241,0.48)',
    border: 'rgba(236,239,241,0.08)',
    accent: '#8FB6A1',
    accentSoft: 'rgba(143,182,161,0.18)',
    success: '#86A98E',
    warning: '#C8AE6A',
    danger: '#C98282'
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 8
  },
  typography: {
    display: {
      fontFamily: displayFamily,
      fontSize: 44,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 48
    },
    title: {
      fontFamily: displayFamily,
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 32
    },
    section: {
      fontFamily: displayFamily,
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 16
    },
    body: {
      fontFamily,
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 24
    },
    caption: {
      fontFamily,
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0,
      lineHeight: 16
    },
    displayFamily,
    bodyFamily: fontFamily,
    brand: displayFamily
  }
} as const;

export const sectionTitle = {
  ...theme.typography.section,
  color: theme.colors.text72,
  letterSpacing: 0,
  textTransform: 'uppercase' as const
};
