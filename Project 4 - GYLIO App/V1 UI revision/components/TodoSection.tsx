import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../constants/theme';
import { newId } from '../lib/date';
import { getTasks, saveTasks } from '../services/storageService';
import type { Task } from '../types';
import { EmptyState, MetaPill, OutlineIcon, SectionHeader, Surface, textStyles } from './Primitives';

type TodoSectionProps = {
  date: string;
};

export function TodoSection({ date }: TodoSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let mounted = true;
    getTasks(date).then((savedTasks) => {
      if (mounted) {
        setTasks(savedTasks);
      }
    });

    return () => {
      mounted = false;
    };
  }, [date]);

  const incompleteCount = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);

  async function commitTasks(nextTasks: Task[]) {
    setTasks(nextTasks);
    await saveTasks(date, nextTasks);
  }

  async function addTask() {
    const title = draft.trim();
    if (!title) {
      return;
    }

    const nextTasks = [
      ...tasks,
      {
        id: newId('task'),
        title,
        completed: false,
        date
      }
    ];

    setDraft('');
    await commitTasks(nextTasks);
  }

  async function toggleTask(taskId: string) {
    await commitTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  }

  async function deleteTask(taskId: string) {
    await commitTasks(tasks.filter((task) => task.id !== taskId));
  }

  return (
    <Surface style={styles.section}>
      <SectionHeader title="Tasks" caption="Daily execution only" action={<MetaPill>{incompleteCount} open</MetaPill>} />
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="One clean action"
          placeholderTextColor={theme.colors.text48}
          returnKeyType="done"
          onSubmitEditing={addTask}
          style={styles.input}
        />
        <Pressable onPress={addTask} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <OutlineIcon name="plus" size={18} color={theme.colors.backgroundDeep} />
        </Pressable>
      </View>
      <View style={styles.taskList}>
        {tasks.length === 0 ? (
          <EmptyState
            icon="check"
            title="No tasks set"
            body="Choose one action that would make the day feel deliberate."
          />
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                onPress={() => toggleTask(task.id)}
                style={[styles.check, task.completed && styles.checkComplete]}
              >
                {task.completed ? <OutlineIcon name="check" size={14} color={theme.colors.backgroundDeep} /> : null}
              </Pressable>
              <Pressable onPress={() => toggleTask(task.id)} style={styles.taskTitleButton}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleComplete]}>{task.title}</Text>
              </Pressable>
              <Pressable onPress={() => deleteTask(task.id)} hitSlop={10}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs
  },
  input: {
    flex: 1,
    minHeight: 52,
    backgroundColor: 'rgba(236,239,241,0.05)',
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    ...theme.typography.body,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  addButton: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    height: 52,
    width: 52
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  },
  taskList: {
    gap: theme.spacing.xs
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 48
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.text48
  },
  checkComplete: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success
  },
  taskTitleButton: {
    flex: 1
  },
  taskTitle: {
    ...textStyles.body,
    color: theme.colors.text,
    lineHeight: 22
  },
  taskTitleComplete: {
    color: theme.colors.text48,
    textDecorationLine: 'line-through'
  },
  deleteText: {
    ...textStyles.caption,
    color: theme.colors.text48
  }
});
