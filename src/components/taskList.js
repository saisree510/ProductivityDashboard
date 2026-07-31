import { getTasks, addTask, toggleTask, deleteTask } from '../services/taskService.js';
import { onStorageChange } from '../services/storage.js';

/**
 * Initializes the Task List Widget Component
 */
export async function initTaskList(containerEl) {
  if (!containerEl) return;

  const tasks = await getTasks();
  renderWidget(containerEl, tasks);

  // Subscribe to storage updates
  onStorageChange(async (changes) => {
    if (changes.tasks) {
      const updatedTasks = await getTasks();
      renderTaskListOnly(updatedTasks);
    }
  });
}

function renderWidget(containerEl, tasks) {
  const activeCount = tasks.filter(t => !t.isCompleted).length;

  containerEl.innerHTML = `
    <div class="glass-card task-list-card">
      <div class="task-list-header">
        <span class="task-list-title">Tasks</span>
        <span id="task-count-badge" class="task-count-badge">${activeCount} active</span>
      </div>

      <div class="task-input-wrapper">
        <input
          type="text"
          id="task-add-input"
          class="glass-input task-input"
          placeholder="Add a new task..."
          autocomplete="off"
        />
      </div>

      <div id="task-items-container" class="task-items-container">
        ${renderTaskItemsHtml(tasks)}
      </div>
    </div>
  `;

  // Bind Add Input Event
  const inputEl = document.getElementById('task-add-input');
  if (inputEl) {
    inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && inputEl.value.trim()) {
        await addTask(inputEl.value);
        inputEl.value = '';
      }
    });
  }

  // Bind Event Delegation for Checkbox & Delete Actions
  const itemsContainer = document.getElementById('task-items-container');
  if (itemsContainer) {
    itemsContainer.addEventListener('click', async (e) => {
      const target = e.target;
      const row = target.closest('.task-item-row');
      if (!row) return;

      const taskId = row.dataset.taskId;

      if (target.classList.contains('task-checkbox')) {
        await toggleTask(taskId);
      } else if (target.classList.contains('task-delete-btn')) {
        await deleteTask(taskId);
      }
    });
  }
}

function renderTaskListOnly(tasks) {
  const itemsContainer = document.getElementById('task-items-container');
  const countBadge = document.getElementById('task-count-badge');

  if (itemsContainer) {
    itemsContainer.innerHTML = renderTaskItemsHtml(tasks);
  }

  if (countBadge) {
    const activeCount = tasks.filter(t => !t.isCompleted).length;
    countBadge.textContent = `${activeCount} active`;
  }
}

function renderTaskItemsHtml(tasks) {
  if (!tasks || tasks.length === 0) {
    return `<div class="task-empty-state">No tasks yet. Add one above!</div>`;
  }

  return tasks.map(task => {
    const completedClass = task.isCompleted ? 'completed' : '';
    const checkedAttr = task.isCompleted ? 'checked' : '';

    return `
      <div class="task-item-row ${completedClass}" data-task-id="${task.id}">
        <div class="task-item-left">
          <input
            type="checkbox"
            class="task-checkbox"
            ${checkedAttr}
            title="Toggle task completion"
          />
          <span class="task-text" title="${escapeHtml(task.text)}">${escapeHtml(task.text)}</span>
        </div>
        <button class="task-delete-btn" title="Delete task">✕</button>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
