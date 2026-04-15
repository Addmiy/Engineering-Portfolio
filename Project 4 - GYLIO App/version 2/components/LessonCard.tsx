import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { DailyLesson } from '../types';

type LessonCardProps = {
  lesson: DailyLesson | null;
};

export function LessonCard({ lesson }: LessonCardProps) {
  if (!lesson) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.kicker}>Lesson of the day</Text>
        <Text style={styles.emptyTitle}>Your morning lesson will appear after activation.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>{lesson.trait}</Text>
      <Text style={styles.title}>{lesson.lessonTitle}</Text>
      <Text style={styles.lesson}>{lesson.lessonText}</Text>
      {lesson.appliedTodayText ? (
        <View style={styles.appliedBlock}>
          <Text style={styles.appliedLabel}>Applied today</Text>
          <Text style={styles.appliedText}>{lesson.appliedTodayText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  kicker: {
    color: theme.colors.accent,
    fontFamily: theme.typography.brand,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: theme.spacing.md
  },
  lesson: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 18,
    lineHeight: 28,
    marginTop: theme.spacing.md
  },
  appliedBlock: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  appliedLabel: {
    color: theme.colors.textDim,
    fontFamily: theme.typography.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  appliedText: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 18,
    lineHeight: 26,
    marginTop: theme.spacing.sm
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 35,
    marginTop: theme.spacing.md
  }
});
