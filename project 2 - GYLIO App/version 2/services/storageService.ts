import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TRAIT } from '../constants/traits';
import { todayKey } from '../lib/date';
import type { AlarmSettings, DailyLesson, JournalEntry, Task } from '../types';

const STORAGE_KEYS = {
  alarm: 'gylio.alarm.settings',
  alarmNotificationId: 'gylio.alarm.notificationId',
  lesson: (date: string) => `gylio.lesson.${date}`,
  tasks: (date: string) => `gylio.tasks.${date}`,
  journal: (date: string) => `gylio.journal.${date}`
};

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  time: '06:30',
  enabled: false,
  selectedTrait: DEFAULT_TRAIT
};

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getAlarmSettings() {
  return readJson<AlarmSettings>(STORAGE_KEYS.alarm);
}

export async function getAlarmSettingsWithDefaults() {
  const settings = await getAlarmSettings();
  return settings ?? DEFAULT_ALARM_SETTINGS;
}

export async function saveAlarmSettings(settings: AlarmSettings) {
  await writeJson(STORAGE_KEYS.alarm, settings);
}

export async function getAlarmNotificationId() {
  return AsyncStorage.getItem(STORAGE_KEYS.alarmNotificationId);
}

export async function saveAlarmNotificationId(identifier: string | null) {
  if (!identifier) {
    await AsyncStorage.removeItem(STORAGE_KEYS.alarmNotificationId);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.alarmNotificationId, identifier);
}

export async function getDailyLesson(date = todayKey()) {
  return readJson<DailyLesson>(STORAGE_KEYS.lesson(date));
}

export async function saveDailyLesson(lesson: DailyLesson) {
  await writeJson(STORAGE_KEYS.lesson(lesson.date), lesson);
}

export async function getTasks(date = todayKey()) {
  return (await readJson<Task[]>(STORAGE_KEYS.tasks(date))) ?? [];
}

export async function saveTasks(date: string, tasks: Task[]) {
  await writeJson(STORAGE_KEYS.tasks(date), tasks);
}

export async function getJournalEntry(date = todayKey()) {
  return readJson<JournalEntry>(STORAGE_KEYS.journal(date));
}

export async function saveJournalEntry(entry: JournalEntry) {
  await writeJson(STORAGE_KEYS.journal(entry.date), entry);
}
