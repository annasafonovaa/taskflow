import "./src/style.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type Status = "To Do" | "In Progress" | "Done";
type Priority = "Low" | "Medium" | "High";

type Task = {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  due: string;
};

const statuses: Status[] = ["To Do", "In Progress", "Done"];
const priorities: Priority[] = ["Low", "Medium", "High"];
const storageKey = "taskflow.tasks.v1";

function loadTasks(): Task[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    if (!Array.isArray(data)) return [];

    return data.filter(
      (task): task is Task =>
        task !== null &&
        typeof task === "object" &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        statuses.includes(task.status) &&
        priorities.includes(task.priority) &&
        typeof task.due === "string"
    );
  } catch {
    return [];
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [due, setDue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
      setStorageError("");
    } catch {
      setStorageError(
        "Your browser could not save changes. Keep this tab open to avoid losing them."
      );
    }
  }, [tasks]);

  function resetForm() {
    setTitle("");
    setPriority("Medium");
    setDue("");
    setEditingId(null);
  }

  function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? { ...task, title: cleanTitle, priority, due }
            : task
        )
      );
    } else {
      setTasks((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          title: cleanTitle,
          priority,
          due,
          status: "To Do"
        }
      ]);
    }

    resetForm();
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
    setPriority(task.priority);
    setDue(task.due);
  }

  function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    if (editingId === task.id) resetForm();
  }

  const visibleTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(search.trim().toLowerCase()) &&
      (filter === "All" || task.priority === filter)
  );

  const completed = tasks.filter((task) => task.status === "Done").length;

  return (
    <main className="workspace">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>TaskFlow<span>✦</span></h1>
          <p>Clear your mind. Organise your day.</p>
        </div>
        <div className="summary">
          <strong>{completed} / {tasks.length}</strong>
          <span>tasks completed</span>
        </div>
      </header>

      {storageError && <p role="alert">{storageError}</p>}

      <form className="task-form" onSubmit={saveTask}>
        <label className="title-field">
          Task name
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to get done?"
            maxLength={160}
            required
          />
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as Priority)
            }
          >
            {priorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
          />
        </label>

        <button className="primary" type="submit">
          {editingId ? "Save task" : "+ Add task"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <section className="toolbar" aria-label="Task filters">
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search your tasks…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by priority"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="All">All priorities</option>
          {priorities.map((item) => (
            <option key={item} value={item}>{item} priority</option>
          ))}
        </select>
      </section>

      <div className="board">
        {statuses.map((status) => {
          const columnTasks = visibleTasks.filter(
            (task) => task.status === status
          );

          return (
            <section className="column" key={status}>
              <h2>
                {status}
                <span className="count">{columnTasks.length}</span>
              </h2>

              {columnTasks.length === 0 && (
                <p className="empty">No tasks here yet.</p>
              )}

              {columnTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <span className={`badge ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  <h3>{task.title}</h3>

                  {task.due && (
                    <p className="due">
                      Due <time dateTime={task.due}>{task.due}</time>
                    </p>
                  )}

                  <label className="status-label">
                    Status
                    <select
                      value={task.status}
                      onChange={(event) => {
                        const nextStatus = event.target.value as Status;
                        setTasks((current) =>
                          current.map((item) =>
                            item.id === task.id
                              ? { ...item, status: nextStatus }
                              : item
                          )
                        );
                      }}
                    >
                      {statuses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <div className="card-actions">
                    <button type="button" onClick={() => editTask(task)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete"
                      onClick={() => deleteTask(task)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>

      <footer>
        Saved in this browser · Your tasks stay on this device
      </footer>
    </main>
  );
}

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
