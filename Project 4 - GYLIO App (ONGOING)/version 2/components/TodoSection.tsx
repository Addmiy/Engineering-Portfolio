import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { sectionTitle, theme } from '../constants/theme';
import { newId } from '../lib/date';
import { getTasks, saveTasks } from '../services/storageService';
import type { Task } from '../types';

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
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={sectionTitle}>To-do</Text>
        <Text style={styles.meta}>{incompleteCount} open</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="One clean action"
          placeholderTextColor={theme.colors.textDim}
          returnKeyType="done"
          onSubmitEditing={addTask}
          style={styles.input}
        />
        <Pressable onPress={addTask} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.taskList}>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks for this day.</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                onPress={() => toggleTask(task.id)}
                style={[styles.check, task.completed && styles.checkComplete]}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
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
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 16,
    paddingVertical: theme.spacing.sm
  },
  addButton: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: theme.spacing.lg
  },
  pressed: {
    opacity: 0.72
  },
  addButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.brand,
    fontSize: 13,
    fontWeight: '700'
  },
  taskList: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md
  },
  empty: {
    color: theme.colors.textDim,
    fontFamily: theme.typography.body,
    fontSize: 15
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 34
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.textDim
  },
  checkComplete: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent
  },
  taskTitleButton: {
    flex: 1
  },
  taskTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 16,
    lineHeight: 22
  },
  taskTitleComplete: {
    color: theme.colors.textDim,
    textDecorationLine: 'line-through'
  },
  deleteText: {
    color: theme.colors.textDim,
    fontFamily: theme.typography.body,
    fontSize: 12
  }
});
