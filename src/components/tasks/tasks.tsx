import { useTimerStore } from "@/store/index.store";
import { Eraser } from "lucide-react";

import { useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  duration: number;
}

const DB_NAME = "TasksDB";
const STORE_NAME = "tasks";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTasks = async (): Promise<Task[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
  });
};

const addTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.add(task);
};

const updateTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(task);
};

const deleteTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(task.id);
};

export default function Tasks() {
  const [taskSelected, setTaskSelected] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskValue, setTaskValue] = useState<string>("");
  const { startTime, startTimer, stopTimer } = useTimerStore();

  useEffect(() => {
    getTasks().then(setTasks);
    if (typeof window !== "undefined") {
      const taskInProcess = window.localStorage.getItem("taskInProcess");
      setTaskSelected(taskInProcess ? JSON.parse(taskInProcess) : null);
    }
  }, []);

  const handleTaskSelected = (task: Task) => {
    if (taskSelected?.id !== task.id) {
      handleUpdateTask();
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "taskInProcess",
        JSON.stringify({ id: task.id, title: task.title, time: Date.now() })
      );
    }

    setTaskSelected(task);
    stopTimer();

    setTimeout(() => {
      startTimer();
    }, 500);
  };

  const handleAddTask = async () => {
    const newTask = {
      id: Date.now(),
      title: taskValue,
      duration: 0,
    };
    await addTask(newTask);
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = async () => {
    if (!taskSelected || !startTime) return;
    const updatedTask = {
      ...taskSelected,
      title: `${taskSelected.title}`,
      duration: (Date.now() - startTime) / 1000,
    };
    await updateTask(updatedTask);
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = async (task: Task) => {
    if (taskSelected?.id === task.id) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("taskInProcess");
      }
      setTaskSelected(null);
      stopTimer();
    }
    await deleteTask(task);
    setTasks(tasks.filter((t) => t.id !== task.id));
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskValue(e.target.value);
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-ld:h-[50dvh]">
      <div className="from-pink-400/20 to-transparent bg-gradient-to-b p-8 flex flex-col items-center justify-center space-y-4 rounded-2xl shadow-md border-x border-t border-gray-400 min-h-[100px] z-[6]">
        {taskSelected && (
          <p className="max-lg:rotate-270">{taskSelected.title}</p>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-4">
        <ul
          className="space-y-2  lg:h-[85dvh] overflow-y-scroll pr-2"
          style={{ scrollbarWidth: "none" }}
        >
          {tasks.map((task) => (
            <li key={task.id} className="relative">
              <button
                className={`flex items-center justify-between text-xs w-full ${
                  taskSelected?.id === task.id
                    ? "bg-green-200/20"
                    : "bg-white/20"
                }  p-3.5 rounded-sm shadow-md border border-gray-400 min-h-[20px] mx-auto`}
                onClick={() => handleTaskSelected(task)}
              >
                <p>{task.title}</p>
                <span className="mr-6">
                  {Math.floor(task.duration / 3600)}h{" "}
                  {Math.max(
                    0,
                    Number(((task.duration - 30) / 60).toFixed(0)) -
                      60 * Math.floor(task.duration / 3600)
                  )}
                  m
                </span>
              </button>
              <button
                onClick={() => handleDeleteTask(task)}
                type="button"
                className="absolute right-2 top-3"
              >
                <Eraser size={20} />
              </button>
            </li>
          ))}
        </ul>

        <fieldset className="text-xs grid grid-cols-3 gap-2">
          <input
            className="p-2 bg-white/20 rounded shadow-md col-span-2"
            type="text"
            name="title"
            placeholder="Task title"
            autoComplete="off"
            onChange={(e) => handleChangeInput(e)}
          />
          <button
            className="bg-black text-white py-2 px-4 rounded-md w-full block"
            type="button"
            onClick={handleAddTask}
            disabled={!taskValue}
          >
            Add task
          </button>
        </fieldset>
      </div>
    </div>
  );
}
