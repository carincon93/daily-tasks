import { useTimerStore, useUserStore } from "@/store/index.store";
import { Eraser } from "lucide-react";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "@/components/ChartArea";
import { Category, Task } from "@/lib/types";

import {
  createTask,
  deleteTask,
  fetchCategories,
  fetchTasks,
} from "@/services/tasks-graphql";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Tasks() {
  const [taskSelected, setTaskSelected] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskValue, setTaskValue] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySelected, setCategorySelected] = useState<Partial<Category>>();

  const { startTime, startTimer, stopTimer } = useTimerStore();
  const { userId } = useUserStore();

  useEffect(() => {
    if (!userId) return;

    if (typeof window !== "undefined") {
      const taskInProcess = window.localStorage.getItem("taskInProcess");
      setTaskSelected(taskInProcess ? JSON.parse(taskInProcess) : null);
    }
    fetchTasks(userId).then(setTasks);
    fetchCategories().then(setCategories);
  }, []);

  const handleTaskSelected = (task: Task) => {
    if (taskSelected?.id !== task.id) {
      handleUpdateTask();
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "taskInProcess",
        JSON.stringify({
          id: task.id,
          title: task.description,
          time: Date.now(),
        })
      );
    }

    setTaskSelected(task);
    stopTimer();

    setTimeout(() => {
      startTimer();
    }, 500);
  };

  const handleAddTask = async () => {
    if (!userId || categorySelected?.id === undefined || !taskValue) return;

    const newTask: Partial<Task> = {
      user_id: userId,
      category_id: categorySelected?.id,
      description: taskValue,
      milliseconds: 0,
    };

    createTask(newTask).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleUpdateTask = async () => {
    if (!taskSelected || !startTime) return;
    const updatedTask: Task = {
      ...taskSelected,
      description: `${taskSelected.description}`,
      milliseconds: (Date.now() - startTime) / 1000,
    };
    // await updateTask(updatedTask);
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = async (task: Task) => {
    if (!task || !userId) return;

    deleteTask(task).then(() => fetchTasks(userId).then(setTasks));
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
          {tasks &&
            tasks.map((task) => (
              <li key={task.id} className="relative bg-white">
                <button
                  className={`flex items-center justify-between text-xs w-full ${
                    taskSelected?.id === task.id
                      ? "bg-green-200/20"
                      : "bg-white/20"
                  }  p-3.5 rounded-sm shadow-md border min-h-[20px] mx-auto`}
                  onClick={() => handleTaskSelected(task)}
                >
                  <p className="max-md:text-[10px] text-left relative pr-7">
                    {task.description}
                  </p>
                </button>
                <div className="bg-white/40 absolute right-2 top-1.5 size-8 blur-md"></div>

                <span className="text-xs absolute top-[24px] right-2">
                  {Math.floor(task.milliseconds / 3600)}h{" "}
                  {Math.max(
                    0,
                    Number(((task.milliseconds - 30) / 60).toFixed(0)) -
                      60 * Math.floor(task.milliseconds / 3600)
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
          <div className="text-xs md:grid grid-cols-4 gap-2 max-md:space-y-2">
            <Input
              className="col-span-2 bg-white text-black w-full"
              type="text"
              name="title"
              placeholder="Task title"
              autoComplete="off"
              onChange={(e) => handleChangeInput(e)}
            />

            <Select
              onValueChange={(value) => {
                setCategorySelected({ id: value });
              }}
            >
              <SelectTrigger
                className="bg-white w-full"
                aria-label="Select a category"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((category) => (
                  <SelectItem value={category.id} key={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" disabled={!taskValue}>
              Add task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
