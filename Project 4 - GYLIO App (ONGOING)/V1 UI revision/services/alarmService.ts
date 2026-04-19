import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import type { AlarmSettings } from '../types';
import { getAlarmNotificationId, saveAlarmNotificationId } from './storageService';

const ALARM_CHANNEL_ID = 'gylio-morning';
const SUPPORTS_NATIVE_NOTIFICATIONS = Platform.OS !== 'web';

export function configureNotifications() {
  if (!SUPPORTS_NATIVE_NOTIFICATIONS) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

export async function ensureAlarmChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Morning activation',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 600, 250, 600],
    lightColor: '#B7C0C7'
  });
}

export async function requestNotificationPermissions() {
  if (!SUPPORTS_NATIVE_NOTIFICATIONS) {
    return false;
  }

  await ensureAlarmChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.status === 'granted') {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true
    }
  });

  return requested.granted || requested.status === 'granted';
}

export async function cancelAlarmNotification() {
  if (!SUPPORTS_NATIVE_NOTIFICATIONS) {
    await saveAlarmNotificationId(null);
    return;
  }

  const identifier = await getAlarmNotificationId();
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  await saveAlarmNotificationId(null);
}

export async function scheduleAlarmNotification(settings: AlarmSettings) {
  await cancelAlarmNotification();

  if (!settings.enabled) {
    return null;
  }

  if (!SUPPORTS_NATIVE_NOTIFICATIONS) {
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    throw new Error('Notifications are disabled. Enable notifications to use the wake activation.');
  }

  const [hour, minute] = settings.time.split(':').map(Number);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'GYLIO',
      body: 'Begin before the day begins.',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        url: '/activation',
        trait: settings.selectedTrait
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ALARM_CHANNEL_ID
    }
  });

  await saveAlarmNotificationId(identifier);
  return identifier;
}
