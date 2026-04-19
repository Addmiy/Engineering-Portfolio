import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import { ScreenContainer } from '../components/ScreenContainer';
import { sectionTitle, theme } from '../constants/theme';
import { TRAITS } from '../constants/traits';
import { dateToTimeString, displayTime, timeStringToDate } from '../lib/date';
import { cancelAlarmNotification, scheduleAlarmNotification } from '../services/alarmService';
import { getAlarmSettingsWithDefaults, saveAlarmSettings } from '../services/storageService';
import type { AlarmSettings } from '../types';

export default function AlarmScreen() {
  const [settings, setSettings] = useState<AlarmSettings | null>(null);
  const [webTimeDraft, setWebTimeDraft] = useState('');
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getAlarmSettingsWithDefaults().then((savedSettings) => {
      setSettings(savedSettings);
      setWebTimeDraft(savedSettings.time);
    });
  }, []);

  function updateSetting(next: Partial<AlarmSettings>) {
    setSettings((current) => (current ? { ...current, ...next } : current));
  }

  function handleTimeChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    updateSetting({ time: dateToTimeString(selected) });
  }

  function commitWebTime(nextTime: string) {
    const match = /^(\d{1,2}):?(\d{2})$/.exec(nextTime.trim());
    if (!match) {
      setWebTimeDraft(settings?.time ?? '');
      return;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
      setWebTimeDraft(settings?.time ?? '');
      return;
    }

    const normalizedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setWebTimeDraft(normalizedTime);
    updateSetting({ time: normalizedTime });
  }

  function handleWebTimeChange(nextTime: string) {
    setWebTimeDraft(nextTime.replace(/[^\d:]/g, '').slice(0, 5));
  }

  async function save() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveAlarmSettings(settings);
      if (settings.enabled) {
        await scheduleAlarmNotification(settings);
      } else {
        await cancelAlarmNotification();
      }

      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the alarm.');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
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
          <Text style={styles.brand}>GYLIO</Text>
          <Text style={styles.title}>Shape the first moment.</Text>
          <Text style={styles.body}>Set the wake time and the trait your morning should answer to.</Text>
        </View>

        <View style={styles.block}>
          <Text style={sectionTitle}>Wake time</Text>
          {Platform.OS === 'web' ? (
            <View style={styles.webTimeField}>
              <TextInput
                accessibilityLabel="Wake time"
                inputMode="numeric"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onChangeText={handleWebTimeChange}
                onBlur={() => commitWebTime(webTimeDraft)}
                onSubmitEditing={() => commitWebTime(webTimeDraft)}
                style={styles.webTimeInput}
                value={webTimeDraft}
              />
              <Text style={styles.timeCaption}>Use 24-hour time, like 06:30</Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setShowPicker(true)}
                style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
              >
                <Text style={styles.timeText}>{displayTime(settings.time)}</Text>
                <Text style={styles.timeCaption}>Tap to edit</Text>
              </Pressable>
              {showPicker ? (
                <DateTimePicker
                  value={timeStringToDate(settings.time)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  themeVariant="dark"
                />
              ) : null}
            </>
          )}
        </View>

        <View style={styles.block}>
          <View style={styles.switchRow}>
            <View>
              <Text style={sectionTitle}>Alarm</Text>
              <Text style={styles.muted}>
                {Platform.OS === 'web'
                  ? 'Saved for testing. Browser notifications are not scheduled from this web build.'
                  : 'Notification opens the activation flow after you tap it.'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(enabled) => updateSetting({ enabled })}
              trackColor={{ false: theme.colors.surfaceSoft, true: theme.colors.accent }}
              thumbColor={settings.enabled ? theme.colors.text : theme.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={sectionTitle}>Trait</Text>
          <View style={styles.traits}>
            {TRAITS.map((trait) => {
              const selected = settings.selectedTrait === trait.value;
              return (
                <Pressable
                  key={trait.value}
                  onPress={() => updateSetting({ selectedTrait: trait.value })}
                  style={({ pressed }) => [
                    styles.traitPill,
                    selected && styles.traitPillSelected,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.traitText, selected && styles.traitTextSelected]}>{trait.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {message ? <Text style={styles.error}>{message}</Text> : null}

        <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving' : 'Save morning'}</Text>
        </Pressable>
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
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  brand: {
    color: theme.colors.accent,
    fontFamily: theme.typography.brand,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 43,
    marginTop: theme.spacing.md
  },
  body: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 17,
    lineHeight: 25,
    marginTop: theme.spacing.md
  },
  block: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  timeButton: {
    paddingTop: theme.spacing.lg
  },
  webTimeField: {
    paddingTop: theme.spacing.lg
  },
  webTimeInput: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: 0,
    padding: 0
  },
  timeText: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: 0
  },
  timeCaption: {
    color: theme.colors.textDim,
    fontFamily: theme.typography.body,
    fontSize: 14,
    marginTop: theme.spacing.xs
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'space-between'
  },
  muted: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
    maxWidth: 250
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  traitPill: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  traitPillSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text
  },
  traitText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 14,
    textTransform: 'capitalize'
  },
  traitTextSelected: {
    color: theme.colors.background,
    fontWeight: '700'
  },
  error: {
    color: theme.colors.danger,
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: theme.spacing.lg
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minHeight: 54,
    marginTop: theme.spacing.xl
  },
  saveButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.brand,
    fontSize: 15,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.72
  }
});
