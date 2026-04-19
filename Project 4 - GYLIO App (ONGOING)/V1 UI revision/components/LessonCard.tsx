import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { DailyLesson } from '../types';
import { EmptyState, FadeInView, MetaPill, OutlineIcon, Surface, textStyles } from './Primitives';

type LessonCardProps = {
  lesson: DailyLesson | null;
};

export function LessonCard({ lesson }: LessonCardProps) {
  if (!lesson) {
    return (
      <Surface gradient style={styles.container}>
        <EmptyState
          icon="spark"
          title="No lesson yet"
          body="Complete a morning activation and the lesson will become the focus for this day."
        />
      </Surface>
    );
  }

  return (
    <FadeInView>
      <Surface gradient style={styles.container}>
        <View style={styles.headerRow}>
          <MetaPill>{lesson.trait}</MetaPill>
          <OutlineIcon name="spark" size={22} color={theme.colors.text48} />
        </View>
        <Text style={styles.title}>{lesson.lessonTitle}</Text>
        <Text style={styles.lesson}>{lesson.lessonText}</Text>
        {lesson.appliedTodayText ? (
          <View style={styles.appliedBlock}>
            <View style={styles.progressBar} />
            <View style={styles.appliedCopy}>
              <Text style={styles.appliedLabel}>Applied today</Text>
              <Text style={styles.appliedText}>{lesson.appliedTodayText}</Text>
            </View>
          </View>
        ) : null}
      </Surface>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    ...textStyles.display,
    marginTop: theme.spacing.xs
  },
  lesson: {
    ...textStyles.body,
    color: theme.colors.text72,
    maxWidth: 460
  },
  appliedBlock: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  progressBar: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    height: 48,
    width: 3
  },
  appliedCopy: {
    flex: 1,
    gap: theme.spacing.xs
  },
  appliedLabel: {
    ...textStyles.caption,
    color: theme.colors.text48,
    textTransform: 'uppercase'
  },
  appliedText: {
    ...textStyles.body,
    color: theme.colors.text
  }
});
