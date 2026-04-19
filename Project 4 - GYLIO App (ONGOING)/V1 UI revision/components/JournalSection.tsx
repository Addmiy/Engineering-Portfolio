import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '../constants/theme';
import { newId } from '../lib/date';
import { getJournalEntry, saveJournalEntry } from '../services/storageService';
import { EmptyState, MetaPill, SectionHeader, Surface } from './Primitives';

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
    <Surface style={styles.section}>
      <SectionHeader title="Journal" caption="Private reflection" action={<MetaPill tone="success">Auto-saved</MetaPill>} />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What matters today?"
        placeholderTextColor={theme.colors.text48}
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
      {content.trim().length === 0 ? (
        <View pointerEvents="none" style={styles.emptyOverlay}>
          <EmptyState
            icon="journal"
            title="Start with one sentence"
            body="Name what deserves your attention before the day gets loud."
          />
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm
  },
  input: {
    backgroundColor: 'rgba(236,239,241,0.05)',
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    ...theme.typography.body,
    minHeight: 180,
    padding: theme.spacing.sm
  },
  emptyOverlay: {
    left: theme.spacing.sm,
    opacity: 0.78,
    position: 'absolute',
    right: theme.spacing.sm,
    top: 104
  }
});
