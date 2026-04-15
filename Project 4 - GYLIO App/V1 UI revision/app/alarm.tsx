import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import {
  FadeInView,
  MetaPill,
  OutlineIcon,
  PrimaryButton,
  SectionHeader,
  Surface,
  textStyles
} from '../components/Primitives';
import { ScreenContainer } from '../components/ScreenContainer';
import { theme } from '../constants/theme';
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
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading setup.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FadeInView style={styles.hero}>
            <MetaPill tone={settings.enabled ? 'accent' : 'neutral'}>{settings.enabled ? 'Wake flow active' : 'Wake flow paused'}</MetaPill>
            <Text style={styles.title}>Shape the first moment.</Text>
            <Text style={styles.body}>Choose the time and trait that should meet you before the day gathers noise.</Text>
          </FadeInView>

          <FadeInView delay={60}>
            <Surface gradient style={styles.timeSurface}>
              <SectionHeader title="Wake time" caption="Daily notification trigger" />
              {Platform.OS === 'web' ? (
                <View style={styles.webTimeField}>
                  <TextInput
                    accessibilityLabel="Wake time"
                    inputMode="numeric"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    onBlur={() => commitWebTime(webTimeDraft)}
                    onChangeText={handleWebTimeChange}
                    onSubmitEditing={() => commitWebTime(webTimeDraft)}
                    style={styles.webTimeInput}
                    value={webTimeDraft}
                  />
                  <Text style={styles.timeCaption}>24-hour time, for example 06:30</Text>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.timeText}>{displayTime(settings.time)}</Text>
                    <Text style={styles.timeCaption}>Tap to adjust</Text>
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
            </Surface>
          </FadeInView>

          <FadeInView delay={100}>
            <Surface style={styles.toggleSurface}>
              <View style={styles.toggleIcon}>
                <OutlineIcon name="alarm" color={settings.enabled ? theme.colors.accent : theme.colors.text48} />
              </View>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Morning notification</Text>
                <Text style={styles.toggleBody}>
                  {Platform.OS === 'web'
                    ? 'Saved for web preview. Native builds schedule the wake notification.'
                    : 'The activation opens after you tap the wake notification.'}
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(enabled) => updateSetting({ enabled })}
                trackColor={{ false: 'rgba(236,239,241,0.12)', true: theme.colors.accentSoft }}
                thumbColor={settings.enabled ? theme.colors.accent : theme.colors.text48}
              />
            </Surface>
          </FadeInView>

          <FadeInView delay={140}>
            <Surface style={styles.traitSurface}>
              <SectionHeader title="Trait" caption="The category used for the morning video" />
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
            </Surface>
          </FadeInView>

          {message ? <Text style={styles.error}>{message}</Text> : null}
        </ScrollView>

        <FadeInView delay={180} style={styles.footer}>
          <PrimaryButton disabled={saving} label={saving ? 'Saving' : 'Save morning'} icon="check" onPress={save} />
        </FadeInView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: 'center'
  },
  loadingText: {
    ...textStyles.caption
  },
  screen: {
    flex: 1
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingBottom: 112
  },
  hero: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs
  },
  title: {
    ...textStyles.display
  },
  body: {
    ...textStyles.body,
    maxWidth: 360
  },
  timeSurface: {
    gap: theme.spacing.sm
  },
  webTimeField: {
    gap: theme.spacing.xs
  },
  webTimeInput: {
    ...theme.typography.display,
    color: theme.colors.text,
    padding: 0
  },
  timeButton: {
    gap: theme.spacing.xs
  },
  timeText: {
    ...theme.typography.display,
    color: theme.colors.text
  },
  timeCaption: {
    ...textStyles.caption
  },
  toggleSurface: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  toggleIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,239,241,0.05)',
    borderRadius: theme.radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  toggleCopy: {
    flex: 1,
    gap: theme.spacing.xxs
  },
  toggleTitle: {
    ...textStyles.section,
    color: theme.colors.text
  },
  toggleBody: {
    ...textStyles.caption
  },
  traitSurface: {
    gap: theme.spacing.sm
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs
  },
  traitPill: {
    backgroundColor: 'rgba(236,239,241,0.05)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  traitPillSelected: {
    backgroundColor: theme.colors.accent
  },
  traitText: {
    ...textStyles.caption,
    color: theme.colors.text72,
    textTransform: 'capitalize'
  },
  traitTextSelected: {
    color: theme.colors.backgroundDeep
  },
  error: {
    ...textStyles.caption,
    color: theme.colors.danger
  },
  footer: {
    backgroundColor: 'rgba(17,18,20,0.92)',
    bottom: 0,
    left: 0,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    position: 'absolute',
    right: 0
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  }
});
