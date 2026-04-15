import { StyleSheet, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { readableDate } from '../lib/date';
import { sectionTitle, theme } from '../constants/theme';

type CalendarSectionProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function CalendarSection({ selectedDate, onSelectDate }: CalendarSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={sectionTitle}>Calendar</Text>
        <Text style={styles.dateText}>{readableDate(selectedDate)}</Text>
      </View>
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
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.textDim,
          selectedDayBackgroundColor: theme.colors.accent,
          selectedDayTextColor: theme.colors.background,
          todayTextColor: theme.colors.accent,
          dayTextColor: theme.colors.text,
          monthTextColor: theme.colors.text,
          arrowColor: theme.colors.text,
          textDisabledColor: theme.colors.surfaceSoft,
          textDayFontFamily: theme.typography.body,
          textMonthFontFamily: theme.typography.brand,
          textDayHeaderFontFamily: theme.typography.body,
          textMonthFontSize: 15,
          textDayFontSize: 14,
          textDayHeaderFontSize: 11
        }}
        style={styles.calendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  header: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  dateText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15
  },
  calendar: {
    marginHorizontal: -theme.spacing.md
  }
});
