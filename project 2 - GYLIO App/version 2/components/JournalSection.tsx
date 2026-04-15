import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { sectionTitle, theme } from '../constants/theme';
import { newId } from '../lib/date';
import { getJournalEntry, saveJournalEntry } from '../services/storageService';

type JournalSectionProps = {
  date: string;
};

export function JournalSection({ date }: JournalSectionProps) {
  const [entryId, setEntryId] = useState(() => newId('journal'));
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    getJournalEntry(date).then((entry) => {
      if (!mounted) {
        return;
      }

      setEntryId(entry?.id ?? newId('journal'));
      setContent(entry?.content ?? '');
      setLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, [date]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const timeout = setTimeout(() => {
      saveJournalEntry({
        id: entryId,
        date,
        content
      });
    }, 450);

    return () => clearTimeout(timeout);
  }, [content, date, entryId, loaded]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={sectionTitle}>Journal</Text>
        <Text style={styles.meta}>Auto-saved</Text>
      </View>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What matters today?"
        placeholderTextColor={theme.colors.textDim}
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: theme.spacing.xl
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  meta: {
    color: theme.colors.textDim,
    fontFamily: theme.typography.body,
    fontSize: 13
  },
  input: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 17,
    lineHeight: 25,
    marginTop: theme.spacing.lg,
    minHeight: 180,
    padding: 0
  }
});
