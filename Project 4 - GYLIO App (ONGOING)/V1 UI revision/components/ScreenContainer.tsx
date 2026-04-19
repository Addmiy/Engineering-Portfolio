import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../constants/theme';

type ScreenContainerProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function ScreenContainer({ children, padded = true }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.background, theme.colors.backgroundDeep]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    flex: 1
  },
  padded: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md
  }
});
