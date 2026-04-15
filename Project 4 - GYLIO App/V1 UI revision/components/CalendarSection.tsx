import { StyleSheet } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { readableDate } from '../lib/date';
import { theme } from '../constants/theme';
import { MetaPill, SectionHeader, Surface } from './Primitives';

type CalendarSectionProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function CalendarSection({ selectedDate, onSelectDate }: CalendarSectionProps) {
  return (
    <Surface style={styles.section}>
      <SectionHeader
        title="Calendar"
        caption={readableDate(selectedDate)}
        action={<MetaPill>Today</MetaPill>}
      />
      <Calendar
        current={selectedDate}
        hideExtraDays
        enableSwipeMonths
        onDayPress={(day: DateData) => onSelectDate(day.dateString)}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: theme.colors.accent,
            selectedTextColor: theme.colors.background
          }
        }}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: theme.colors.text48,
          selectedDayBackgroundColor: theme.colors.accent,
          selectedDayTextColor: theme.colors.backgroundDeep,
          todayTextColor: theme.colors.accent,
          dayTextColor: theme.colors.text,
          monthTextColor: theme.colors.text,
          arrowColor: theme.colors.text72,
          textDisabledColor: theme.colors.text48,
          textDayFontFamily: theme.typography.bodyFamily,
          textMonthFontFamily: theme.typography.displayFamily,
          textDayHeaderFontFamily: theme.typography.bodyFamily,
          textMonthFontSize: 15,
          textDayFontSize: 14,
          textDayHeaderFontSize: 11,
          textDayFontWeight: '500',
          textMonthFontWeight: '700'
        }}
        style={styles.calendar}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm
  },
  calendar: {
    marginHorizontal: -theme.spacing.xs
  }
});
