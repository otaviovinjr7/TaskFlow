
/* ==========================================
   TASKFLOW - GERENCIADOR DE TAREFAS
   Autor: Otávio Rogério
   Tecnologias: HTML, CSS, JavaScript
   Armazenamento: LocalStorage
   ========================================== */

// 1. CONFIGURAÇÕES E ELEMENTOS HTML

const STORAGE_KEY = "taskflow_tasks_v1";

const taskForm = document.querySelector("#task-form");
const taskDialog = document.querySelector("#task-dialog");
const openFormButton = document.querySelector("#open-task-form");
const closeFormButton = document.querySelector("#close-task-form");
const cancelFormButton = document.querySelector("#cancel-task");

const taskTitle = document.querySelector("#task-title");
const taskDescription = document.querySelector("#task-description");
const taskPriority = document.querySelector("#task-priority");
const taskDeadline = document.querySelector("#task-deadline");

const taskList = document.querySelector("#task-list");
const searchInput = document.querySelector("#search-task");
const priorityFilter = document.querySelector("#priority-filter");
const sortSelect = document.querySelector("#sort-tasks");

const totalTasksElement = document.querySelector("#total-tasks");
const pendingTasksElement = document.querySelector("#pending-tasks");
const completedTasksElement = document.querySelector("#completed-tasks");
const productivityElement = document.querySelector("#productivity");

const progressLabel = document.querySelector("#progress-label");
const progressFill = document.querySelector("#progress-fill");
const progressTrack = document.querySelector("#progress-track");
const dialogTitle = document.querySelector("#dialog-title");
const saveTaskButton = document.querySelector("#save-task");

const navigationButtons = document.querySelectorAll(".nav-item");

// 2. ESTADO DA APLICAÇÃO

let tasks = loadTasks();
let activeFilter = "all";
let editingTaskId = null;

// 3. FUNÇÕES AUXILIARES

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString) {
  if (!dateString) return "Sem prazo";

  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
}

function getPriorityLabel(priority) {
  const labels = {
    high: "Alta prioridade",
    medium: "Média prioridade",
    low: "Baixa prioridade"
  };

  return labels[priority] || "Média prioridade";
}

function isOverdue(task) {
  return !task.completed &&
    Boolean(task.deadline) &&
    task.deadline < getToday();
}

// 4. LOCALSTORAGE

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (!savedTasks) return [];

    const parsedTasks = JSON.parse(savedTasks);

    if (!Array.isArray(parsedTasks)) return [];

    // Valida os campos básicos antes de usar os dados.
    return parsedTasks.filter((task) => {
      return task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.description === "string" &&
        ["high", "medium", "low"].includes(task.priority) &&
        typeof task.deadline === "string" &&
        typeof task.completed === "boolean" &&
        typeof task.createdAt === "string";
    });
  } catch (error) {
    console.error("Não foi possível carregar as tarefas:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar as tarefas:", error);

    alert(
      "Não foi possível salvar os dados. " +
      "Verifique o armazenamento do navegador."
    );

    return false;
  }
}

// 5. ABRIR E FECHAR O FORMULÁRIO

function openTaskForm(task = null) {
  taskForm.reset();

  editingTaskId = task ? task.id : null;

  if (task) {
    dialogTitle.textContent = "Editar tarefa";
    saveTaskButton.textContent = "Salvar alterações";

    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskPriority.value = task.priority;
    taskDeadline.value = task.deadline;
  } else {
    dialogTitle.textContent = "Nova tarefa";
    saveTaskButton.textContent = "Salvar tarefa";
    taskPriority.value = "medium";
    taskDeadline.value = getToday();
  }

  taskDialog.showModal();
  taskTitle.focus();
}

function closeTaskForm() {
  taskDialog.close();
  taskForm.reset();
  editingTaskId = null;
}

openFormButton.addEventListener("click", () => {
  openTaskForm();
});

closeFormButton.addEventListener("click", closeTaskForm);
cancelFormButton.addEventListener("click", closeTaskForm);

// Fecha se o usuário clicar fora da janela.
taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) {
    closeTaskForm();
  }
});

// 6. CADASTRAR E EDITAR TAREFAS

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();
  const priority = taskPriority.value;
  const deadline = taskDeadline.value;

  if (!title) {
    alert("Informe o título da tarefa.");
    taskTitle.focus();
    return;
  }

  if (!deadline) {
    alert("Informe o prazo da tarefa.");
    taskDeadline.focus();
    return;
  }

  if (!["high", "medium", "low"].includes(priority)) {
    alert("Selecione uma prioridade válida.");
    return;
  }

  if (editingTaskId) {
    const task = tasks.find((item) => item.id === editingTaskId);

    if (!task) {
      alert("Esta tarefa não foi encontrada.");
      closeTaskForm();
      return;
    }

    const updatedTask = {
      ...task,
      title,
      description,
      priority,
      deadline
    };

    tasks = tasks.map((item) =>
      item.id === editingTaskId ? updatedTask : item
    );
  } else {
    const newTask = {
      id: generateId(),
      title,
      description,
      priority,
      deadline,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
  }

  if (!saveTasks()) return;

  closeTaskForm();
  renderApp();
});

// 7. CONCLUIR E EXCLUIR TAREFAS


function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  const previousStatus = task.completed;

  task.completed = !previousStatus;

  if (saveTasks()) {
    renderApp();
  } else {
    task.completed = previousStatus;
    renderApp();
  }
}


function deleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  const confirmed = confirm(
    `Deseja excluir a tarefa "${task.title}"?`
  );

  if (!confirmed) return;

  const previousTasks = tasks;
  tasks = tasks.filter((item) => item.id !== taskId);

  if (saveTasks()) {
    renderApp();
  } else {
    tasks = previousTasks;
  }
}

// 8. CRIAÇÃO SEGURA DOS ELEMENTOS HTML

function createElement(tag, className, text = "") {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  // textContent evita interpretar o texto como HTML.
  element.textContent = text;

  return element;
}

function createBadge(text, className = "") {
  return createElement(
    "span",
    `task-badge ${className}`.trim(),
    text
  );
}

function createActionButton(label, symbol, className, action) {
  const button = createElement(
    "button",
    `icon-button ${className}`.trim(),
    symbol
  );

  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", action);

  return button;
}

// 9. CONSTRUIR UM CARTÃO DE TAREFA

function createTaskCard(task) {
  const card = createElement(
    "article",
    `task-card${task.completed ? " is-completed" : ""}`
  );

  const checkbox = createElement("input", "task-checkbox");

  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    `Concluir tarefa: ${task.title}`
  );

  checkbox.addEventListener("change", () => {
    toggleTask(task.id);
  });

  const main = createElement("div", "task-main");

  const title = createElement("h3", "task-title", task.title);
  const description = createElement(
    "p",
    "task-description",
    task.description || "Sem descrição."
  );

  const metadata = createElement("div", "task-meta");

  const priorityBadge = createBadge(
    getPriorityLabel(task.priority),
    `priority-${task.priority}`
  );

  const deadlineBadge = createBadge(
    `Prazo: ${formatDate(task.deadline)}`
  );

  metadata.append(priorityBadge, deadlineBadge);

  if (isOverdue(task)) {
    metadata.append(
      createBadge("Atrasada", "task-overdue")
    );
  } else if (task.completed) {
    metadata.append(createBadge("Concluída"));
  } else {
    metadata.append(createBadge("Pendente"));
  }

  main.append(title, description, metadata);

  const actions = createElement("div", "task-actions");

  const editButton = createActionButton(
    "Editar tarefa",
    "✎",
    "",
    () => openTaskForm(task)
  );

  const deleteButton = createActionButton(
    "Excluir tarefa",
    "×",
    "delete-button",
    () => deleteTask(task.id)
  );

  actions.append(editButton, deleteButton);
  card.append(checkbox, main, actions);

  return card;
}

// 10. FILTRAR E ORDENAR TAREFAS

function getVisibleTasks() {
  const search = searchInput.value.trim().toLowerCase();
  const priority = priorityFilter.value;

  let result = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search);

    const matchesPriority =
      priority === "all" || task.priority === priority;

    let matchesStatus = true;

    if (activeFilter === "today") {
      matchesStatus =
        !task.completed && task.deadline === getToday();
    }

    if (activeFilter === "pending") {
      matchesStatus = !task.completed;
    }

    if (activeFilter === "completed") {
      matchesStatus = task.completed;
    }

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  result.sort((a, b) => {
    if (sortSelect.value === "priority") {
      return priorityWeight[b.priority] -
        priorityWeight[a.priority];
    }

    if (sortSelect.value === "created") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    // Prazo mais próximo primeiro.
    return a.deadline.localeCompare(b.deadline);
  });

  return result;
}

// 11. ATUALIZAR INDICADORES

function updateStatistics() {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  // Evita divisão por zero quando não há tarefas.
  const productivity = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  totalTasksElement.textContent = total;
  pendingTasksElement.textContent = pending;
  completedTasksElement.textContent = completed;
  productivityElement.textContent = `${productivity}%`;

  progressLabel.textContent = `${productivity}%`;
  progressFill.style.width = `${productivity}%`;

  progressTrack.setAttribute("aria-valuenow", productivity);
}

// 12. RENDERIZAR A LISTA

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const emptyState = createElement("div", "empty-state");

    const heading = createElement(
      "h3",
      "",
      tasks.length === 0
        ? "Nenhuma tarefa por enquanto"
        : "Nenhuma tarefa encontrada"
    );

    const message = createElement(
      "p",
      "",
      tasks.length === 0
        ? "Adicione sua primeira tarefa para começar."
        : "Tente mudar os filtros ou a busca."
    );

    emptyState.append(heading, message);
    taskList.append(emptyState);
    return;
  }

  visibleTasks.forEach((task) => {
    taskList.append(createTaskCard(task));
  });
}

// 13. ATUALIZAR A APLICAÇÃO

function renderApp() {
  updateStatistics();
  renderTasks();
}

// 14. EVENTOS DOS FILTROS

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    navigationButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

searchInput.addEventListener("input", renderTasks);
priorityFilter.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// 15. INICIALIZAÇÃO

renderApp();

console.log("TaskFlow iniciado com sucesso!");
