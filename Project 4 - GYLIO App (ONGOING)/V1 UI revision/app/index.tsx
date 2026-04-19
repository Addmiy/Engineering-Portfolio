import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CalendarSection } from '../components/CalendarSection';
import { JournalSection } from '../components/JournalSection';
import { LessonCard } from '../components/LessonCard';
import {
  FadeInView,
  MetaPill,
  OutlineIcon,
  PrimaryButton,
  SecondaryButton,
  Surface,
  textStyles
} from '../components/Primitives';
import { ScreenContainer } from '../components/ScreenContainer';
import { TodoSection } from '../components/TodoSection';
import { theme } from '../constants/theme';
import { displayTime, todayKey } from '../lib/date';
import { getTodayLesson } from '../services/lessonService';
import { getAlarmSettings } from '../services/storageService';
import type { AlarmSettings, DailyLesson } from '../types';

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [alarm, setAlarm] = useState<AlarmSettings | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayKey());

  useEffect(() => {
    let mounted = true;

    async function load() {
      const savedAlarm = await getAlarmSettings();
      if (!mounted) {
        return;
      }

      if (!savedAlarm) {
        router.replace('/alarm');
        return;
      }

      const savedLesson = await getTodayLesson();
      if (!mounted) {
        return;
      }

      setAlarm(savedAlarm);
      setLesson(savedLesson);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loadingText}>Opening the day.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInView style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>GYLIO</Text>
            <SecondaryButton label="Alarm" icon="alarm" onPress={() => router.push('/alarm')} />
          </View>
          <View style={styles.heroCopy}>
            <MetaPill tone={alarm?.enabled ? 'accent' : 'neutral'}>
              {alarm?.enabled ? `${displayTime(alarm.time)} / ${titleCase(alarm.selectedTrait)}` : 'Alarm disabled'}
            </MetaPill>
            <Text style={styles.heroTitle}>Begin clean.</Text>
            <Text style={styles.heroBody}>One activation, one lesson, one deliberate day.</Text>
          </View>
        </FadeInView>

        <LessonCard lesson={lesson} />

        <FadeInView delay={80}>
          <Surface elevated style={styles.primaryAction}>
            <View style={styles.primaryIcon}>
              <OutlineIcon name="play" color={theme.colors.accent} />
            </View>
            <View style={styles.primaryCopy}>
              <Text style={styles.primaryTitle}>Morning activation</Text>
              <Text style={styles.primaryBody}>Play the selected trait video and set today's lesson.</Text>
            </View>
            <PrimaryButton label="Start" icon="play" onPress={() => router.push('/activation')} style={styles.startButton} />
          </Surface>
        </FadeInView>

        <FadeInView delay={120} style={styles.moduleStack}>
          <CalendarSection selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <TodoSection date={selectedDate} />
          <JournalSection date={selectedDate} />
        </FadeInView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    justifyContent: 'center'
  },
  loadingText: {
    ...textStyles.caption
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl
  },
  header: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xs
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  brand: {
    ...theme.typography.section,
    color: theme.colors.text,
    fontSize: 16
  },
  heroCopy: {
    gap: theme.spacing.sm
  },
  heroTitle: {
    ...textStyles.display
  },
  heroBody: {
    ...textStyles.body,
    maxWidth: 320
  },
  primaryAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  primaryIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  primaryCopy: {
    flex: 1,
    gap: theme.spacing.xxs
  },
  primaryTitle: {
    ...textStyles.section,
    color: theme.colors.text
  },
  primaryBody: {
    ...textStyles.caption,
    color: theme.colors.text48
  },
  startButton: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.sm
  },
  moduleStack: {
    gap: theme.spacing.sm
  }
});
