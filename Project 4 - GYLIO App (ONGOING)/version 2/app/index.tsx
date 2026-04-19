import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CalendarSection } from '../components/CalendarSection';
import { JournalSection } from '../components/JournalSection';
import { LessonCard } from '../components/LessonCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { TodoSection } from '../components/TodoSection';
import { theme } from '../constants/theme';
import { displayTime, todayKey } from '../lib/date';
import { getTodayLesson } from '../services/lessonService';
import { getAlarmSettings } from '../services/storageService';
import type { AlarmSettings, DailyLesson } from '../types';

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
          <ActivityIndicator color={theme.colors.text} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>GYLIO</Text>
            <Text style={styles.subhead}>
              {alarm?.enabled ? `${displayTime(alarm.time)} · ${alarm.selectedTrait}` : 'Alarm disabled'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/alarm')} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Alarm</Text>
          </Pressable>
        </View>

        <LessonCard lesson={lesson} />
        <CalendarSection selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <TodoSection date={selectedDate} />
        <JournalSection date={selectedDate} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.lg
  },
  brand: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0
  },
  subhead: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 13,
    marginTop: theme.spacing.xs,
    textTransform: 'capitalize'
  },
  linkButton: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  linkText: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 13
  },
  pressed: {
    opacity: 0.7
  }
});
