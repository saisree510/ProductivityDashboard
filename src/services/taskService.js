import { getStorage, setStorage } from './storage.js';

/**
 * Task Data Service
 * Manages CRUD operations and automatic completed-to-bottom sorting.
 */

export async function getTasks() {
  const tasks = await getStorage('tasks') || [];
  return sortTasks(tasks);
}

/**
 * Adds a new task item
 */
export async function addTask(text) {
  if (!text || !text.trim()) return null;

  const currentTasks = await getStorage('tasks') || [];
  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    text: text.trim(),
    isCompleted: false,
    createdAt: Date.now()
  };

  const updatedTasks = [newTask, ...currentTasks];
  await setStorage('tasks', updatedTasks);
  return sortTasks(updatedTasks);
}

/**
 * Toggles completion status of a task
 */
export async function toggleTask(id) {
  const currentTasks = await getStorage('tasks') || [];
  const updatedTasks = currentTasks.map(task => {
    if (task.id === id) {
      return { ...task, isCompleted: !task.isCompleted };
    }
    return task;
  });

  await setStorage('tasks', updatedTasks);
  return sortTasks(updatedTasks);
}

/**
 * Deletes a task by ID
 */
export async function deleteTask(id) {
  const currentTasks = await getStorage('tasks') || [];
  const updatedTasks = currentTasks.filter(task => task.id !== id);

  await setStorage('tasks', updatedTasks);
  return sortTasks(updatedTasks);
}

/**
 * Helper function to sort tasks: Active tasks first (newest first), completed tasks at bottom
 */
function sortTasks(tasks) {
  const active = tasks.filter(t => !t.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const completed = tasks.filter(t => t.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  return [...active, ...completed];
}
