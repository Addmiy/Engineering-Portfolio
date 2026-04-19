import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../constants/theme';

type IconName = 'alarm' | 'calendar' | 'check' | 'journal' | 'plus' | 'play' | 'spark' | 'video';

export function FadeInView({
  children,
  delay = 0,
  distance = 10,
  style
}: PropsWithChildren<{ delay?: number; distance?: number; style?: ViewStyle | ViewStyle[] }>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay,
        useNativeDriver: true
      })
    ]).start();
  }, [delay, distance, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function Surface({
  children,
  elevated = false,
  gradient = false,
  style
}: PropsWithChildren<{ elevated?: boolean; gradient?: boolean; style?: ViewStyle | ViewStyle[] }>) {
  const content = <View style={[styles.surface, elevated && styles.surfaceElevated, style]}>{children}</View>;

  if (!gradient) {
    return content;
  }

  return (
    <LinearGradient
      colors={['rgba(236,239,241,0.08)', 'rgba(236,239,241,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientWrap}
    >
      {content}
    </LinearGradient>
  );
}

export function SectionHeader({
  title,
  caption,
  action
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  icon,
  style
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {icon ? <OutlineIcon name={icon} color={theme.colors.backgroundDeep} size={18} /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  style
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, style]}>
      {icon ? <OutlineIcon name={icon} color={theme.colors.text72} size={18} /> : null}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function MetaPill({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'accent' | 'success' }>) {
  return (
    <View style={[styles.metaPill, tone === 'accent' && styles.metaPillAccent, tone === 'success' && styles.metaPillSuccess]}>
      <Text style={[styles.metaPillText, tone !== 'neutral' && styles.metaPillTextActive]}>{children}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <OutlineIcon name={icon} size={22} color={theme.colors.text48} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function OutlineIcon({ name, size = 24, color = theme.colors.text72 }: { name: IconName; size?: number; color?: string }) {
  const iconStyle = { width: size, height: size };
  const line = { backgroundColor: color };
  const border = { borderColor: color };

  if (name === 'alarm') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.iconCircle, border]} />
        <View style={[styles.clockHandHour, line]} />
        <View style={[styles.clockHandMinute, line]} />
      </View>
    );
  }

  if (name === 'calendar') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.calendarBox, border]} />
        <View style={[styles.calendarLine, line]} />
        <View style={[styles.calendarRingLeft, line]} />
        <View style={[styles.calendarRingRight, line]} />
      </View>
    );
  }

  if (name === 'check') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.checkBox, border]} />
        <View style={[styles.checkLine, { borderColor: color }]} />
      </View>
    );
  }

  if (name === 'journal') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.journalBox, border]} />
        <View style={[styles.journalLineOne, line]} />
        <View style={[styles.journalLineTwo, line]} />
      </View>
    );
  }

  if (name === 'plus') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.plusHorizontal, line]} />
        <View style={[styles.plusVertical, line]} />
      </View>
    );
  }

  if (name === 'play') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.playCircle, border]} />
        <View style={[styles.playTriangle, { borderLeftColor: color }]} />
      </View>
    );
  }

  if (name === 'video') {
    return (
      <View style={[styles.icon, iconStyle]}>
        <View style={[styles.videoFrame, border]} />
        <View style={[styles.videoTail, { borderLeftColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.icon, iconStyle]}>
      <View style={[styles.sparkVertical, line]} />
      <View style={[styles.sparkHorizontal, line]} />
      <View style={[styles.sparkDot, { backgroundColor: color }]} />
    </View>
  );
}

export const textStyles: Record<'display' | 'title' | 'section' | 'body' | 'caption', TextStyle> = {
  display: {
    ...theme.typography.display,
    color: theme.colors.text
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text
  },
  section: {
    ...theme.typography.section,
    color: theme.colors.text72,
    textTransform: 'uppercase'
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.text72
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.text48
  }
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: theme.colors.surfaceGlass,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  surfaceElevated: {
    backgroundColor: theme.colors.surfaceRaised
  },
  gradientWrap: {
    borderRadius: theme.radius.lg,
    padding: 1
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between'
  },
  sectionCopy: {
    flex: 1,
    gap: theme.spacing.xs
  },
  sectionTitle: textStyles.section,
  sectionCaption: textStyles.caption,
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    ...theme.typography.section,
    color: theme.colors.backgroundDeep
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,239,241,0.06)',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.sm
  },
  secondaryButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text72
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  },
  metaPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236,239,241,0.06)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs
  },
  metaPillAccent: {
    backgroundColor: theme.colors.accentSoft
  },
  metaPillSuccess: {
    backgroundColor: 'rgba(134,169,142,0.16)'
  },
  metaPillText: {
    ...theme.typography.caption,
    color: theme.colors.text48,
    textTransform: 'uppercase'
  },
  metaPillTextActive: {
    color: theme.colors.accent
  },
  emptyState: {
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,239,241,0.05)',
    borderRadius: theme.radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  emptyTitle: {
    ...theme.typography.section,
    color: theme.colors.text,
    marginTop: theme.spacing.xs
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.text48
  },
  emptyAction: {
    marginTop: theme.spacing.xs
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  iconCircle: {
    borderRadius: 999,
    borderWidth: 1.4,
    height: '76%',
    width: '76%'
  },
  clockHandHour: {
    height: '24%',
    position: 'absolute',
    top: '32%',
    width: 1.4
  },
  clockHandMinute: {
    height: 1.4,
    left: '50%',
    position: 'absolute',
    top: '50%',
    width: '22%'
  },
  calendarBox: {
    borderRadius: 4,
    borderWidth: 1.4,
    height: '72%',
    width: '76%'
  },
  calendarLine: {
    height: 1.4,
    position: 'absolute',
    top: '40%',
    width: '64%'
  },
  calendarRingLeft: {
    height: '18%',
    left: '34%',
    position: 'absolute',
    top: '16%',
    width: 1.4
  },
  calendarRingRight: {
    height: '18%',
    position: 'absolute',
    right: '34%',
    top: '16%',
    width: 1.4
  },
  checkBox: {
    borderRadius: 4,
    borderWidth: 1.4,
    height: '72%',
    width: '72%'
  },
  checkLine: {
    borderBottomWidth: 1.7,
    borderLeftWidth: 1.7,
    height: '22%',
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    width: '40%'
  },
  journalBox: {
    borderRadius: 4,
    borderWidth: 1.4,
    height: '78%',
    width: '66%'
  },
  journalLineOne: {
    height: 1.4,
    position: 'absolute',
    top: '42%',
    width: '38%'
  },
  journalLineTwo: {
    height: 1.4,
    position: 'absolute',
    top: '58%',
    width: '38%'
  },
  plusHorizontal: {
    height: 1.6,
    position: 'absolute',
    width: '64%'
  },
  plusVertical: {
    height: '64%',
    position: 'absolute',
    width: 1.6
  },
  playCircle: {
    borderRadius: 999,
    borderWidth: 1.4,
    height: '78%',
    width: '78%'
  },
  playTriangle: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderTopWidth: 5,
    left: '48%',
    position: 'absolute'
  },
  videoFrame: {
    borderRadius: 4,
    borderWidth: 1.4,
    height: '52%',
    width: '62%'
  },
  videoTail: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderTopWidth: 5,
    position: 'absolute',
    right: '10%'
  },
  sparkVertical: {
    height: '68%',
    position: 'absolute',
    width: 1.4
  },
  sparkHorizontal: {
    height: 1.4,
    position: 'absolute',
    width: '68%'
  },
  sparkDot: {
    borderRadius: 999,
    height: 4,
    position: 'absolute',
    right: '14%',
    top: '14%',
    width: 4
  }
});
