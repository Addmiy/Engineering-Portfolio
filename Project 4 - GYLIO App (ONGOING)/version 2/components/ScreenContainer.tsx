import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../constants/theme';

type ScreenContainerProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function ScreenContainer({ children, padded = true }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg
  }
});
