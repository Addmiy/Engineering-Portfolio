import { useEffect } from 'react';
import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { configureNotifications, ensureAlarmChannel } from '../services/alarmService';
import { theme } from '../constants/theme';

function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((incomingResponse) => {
      redirect(incomingResponse.notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    configureNotifications();
    ensureAlarmChannel();
  }, []);

  useNotificationObserver();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade'
        }}
      />
    </>
  );
}
