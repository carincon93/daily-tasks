import { useTimerStore } from "@/store/index.store";
import { Eraser } from "lucide-react";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "../ChartArea";
import { Task } from "@/lib/types";
import {
  addTask,
  deleteTask,
  getTasks,
  updateTask,
} from "@/services/tasks-indexed-db";
import { fetchCategories } from "@/services/tasks-graphql";

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

  fetchCategories().then(console.log);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAddTask();
    setTaskValue("");
  };

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[60dvh]">
      <div className="from-pink-400/20 to-transparent bg-gradient-to-b p-4 rounded-2xl shadow-md border-x border-t border-gray-400 min-h-[100px] z-[6] relative">
        <ChartAreaInteractive />
      </div>

      <div className="flex flex-col justify-between">
        <ul
          className="space-y-2 lg:h-[85dvh] overflow-y-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {tasks.map((task) => (
            <li key={task.id} className="relative bg-white">
              <button
                className={`flex items-center justify-between text-xs w-full ${
                  taskSelected?.id === task.id
                    ? "bg-green-200/20"
                    : "bg-white/20"
                }  p-3.5 rounded-sm shadow-md border border-gray-400 min-h-[20px] mx-auto`}
                onClick={() => handleTaskSelected(task)}
              >
                <p className="max-md:text-[10px] text-left relative pr-7">
                  {task.title}
                </p>
              </button>
              <div className="bg-white/40 absolute right-2 top-1.5 size-8 blur-md"></div>

              <span className="text-xs absolute top-[24px] right-2">
                {Math.floor(task.duration / 3600)}h{" "}
                {Math.max(
                  0,
                  Number(((task.duration - 30) / 60).toFixed(0)) -
                    60 * Math.floor(task.duration / 3600)
                )}
                m
              </span>
              <button
                onClick={() => handleDeleteTask(task)}
                type="button"
                className="absolute right-2 top-1.5"
              >
                <Eraser size={18} />
                {""}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit}>
          <fieldset className="text-xs md:grid grid-cols-3 gap-2 max-md:space-y-2">
            <input
              className="p-2 bg-white text-black rounded shadow-md col-span-2 w-full"
              type="text"
              name="title"
              placeholder="Task title"
              autoComplete="off"
              onChange={(e) => handleChangeInput(e)}
            />
            <button
              className="dark:bg-white dark:text-black bg-black text-white py-2 px-4 rounded-md w-full block"
              type="submit"
              disabled={!taskValue}
            >
              Add task
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
