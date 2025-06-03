import {
  useTimerStore,
  useUserStore,
  getCurrentDate,
  stopTimer,
} from "@/store/index.store";
import { Eraser, RefreshCcw } from "lucide-react";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "@/components/ChartArea";
import { Category, Task } from "@/lib/types";

import {
  createTask,
  deleteTask,
  fetchCategories,
  fetchTasks,
  updateTask,
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

  const { startTime, endOfDay, taskInProcess, startTimer } = useTimerStore();
  const { userId } = useUserStore();
  const { currentDate } = getCurrentDate();

  const groupedTasksByCategory = () => {
    const grouped = tasks.reduce<Record<string, Record<string, number>>>(
      (acc, task) => {
        const { date, category, milliseconds } = task;
        if (!acc[date]) {
          acc[date] = {};
        }
        acc[date][category.name] = Number(
          (
            (acc[date][category.name] || 0) +
            milliseconds / (1000 * 60 * 60)
          ).toFixed(2)
        );
        return acc;
      },
      {}
    );

    // Convert to desired array format
    const categories = [...new Set(tasks.map((task) => task.category.name))];
    return Object.entries(grouped).map(([date, categoryTotals]) => {
      const row: { date: string; [key: string]: string | number } = { date };
      categories.forEach((cat) => {
        row[cat] = categoryTotals[cat] || 0;
      });
      return row;
    });
  };

  const handleTaskSelected = (task: Task) => {
    if (!task || taskSelected?.id === task.id || currentDate !== task.date)
      return;

    if (taskSelected?.id !== task.id) {
      handleUpdateTask();
    }

    startTimer(task);
    setTaskSelected(task);
  };

  const handleCloneTask = async (task: Task) => {
    if (!userId || !task) return;

    const newTask: Partial<Task> = {
      user_id: task.user_id,
      category_id: task.category_id,
      description: task.description,
      milliseconds: 0,
      is_visible: true,
    };

    createTask(newTask).then(() => fetchTasks(userId).then(setTasks));

    const taskToUpdate: Partial<Task> = {
      id: task.id,
      milliseconds: task.milliseconds,
      is_visible: false,
    };

    updateTask(taskToUpdate).then(() =>
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks
          .sort((a, b) => b.milliseconds - a.milliseconds)
          .map((prevTask) =>
            prevTask.id === task.id
              ? { ...prevTask, is_visible: false }
              : prevTask
          );
        return updatedTasks;
      })
    );
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
    if (!taskSelected || !startTime || !userId) return;

    const newTaskMs = Date.now() - startTime;

    const taskToUpdate: Partial<Task> = {
      id: taskSelected.id,
      milliseconds: newTaskMs,
      is_visible: taskSelected.is_visible,
    };

    updateTask(taskToUpdate).then(() =>
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks
          .sort((a, b) => b.milliseconds - a.milliseconds)
          .map((prevTask) =>
            prevTask.id === taskSelected.id
              ? { ...prevTask, milliseconds: newTaskMs }
              : prevTask
          );
        return updatedTasks;
      })
    );
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
    setCategorySelected({ id: undefined });
  };

  const calculateTaskTime = (task: Task) => {
    const msAccumulated = task.milliseconds;

    const totalMinutes = Math.floor(msAccumulated / (1000 * 60)); // → 5 minutos
    const hours = Math.floor(totalMinutes / 60); // → 0
    const minutes = totalMinutes % 60; // → 5

    return `${hours.toString().padStart(2, "0")}hr ${minutes
      .toString()
      .padStart(2, "0")}min`;
  };

  useEffect(() => {
    if (!userId) return;

    fetchTasks(userId).then(setTasks);
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!taskInProcess) return;

    setTaskSelected(taskInProcess ?? null);

    if (taskInProcess.date !== currentDate) {
      if (!endOfDay || !startTime) return;

      if (Date.now() > endOfDay) {
        stopTimer();

        const taskToUpdate: Partial<Task> = {
          id: taskInProcess.id,
          milliseconds: endOfDay - startTime,
          is_visible: taskInProcess.is_visible,
        };

        updateTask(taskToUpdate).then(() =>
          setTasks((prevTasks) => {
            const updatedTasks = prevTasks
              .sort((a, b) => b.milliseconds - a.milliseconds)
              .map((prevTask) =>
                prevTask.id === taskInProcess.id
                  ? { ...prevTask, milliseconds: endOfDay - startTime }
                  : prevTask
              );
            return updatedTasks;
          })
        );
      }
    }
  }, [taskInProcess]);

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[60dvh]">
      <div className="from-pink-400/20 to-transparent bg-gradient-to-b p-4 rounded-2xl shadow-md border-x border-t border-gray-400 min-h-[100px] z-[6] relative">
        <ChartAreaInteractive
          chartData={groupedTasksByCategory()}
          categories={categories}
        />
      </div>

      <div className="flex flex-col justify-between">
        <ul
          className="space-y-2 lg:h-[85dvh] overflow-y-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {tasks &&
            tasks
              .filter((task) => task.is_visible)
              .sort((a, b) => b.milliseconds - a.milliseconds)
              .map((task) => (
                <li
                  key={task.id}
                  className={`relative bg-white p-3.5 rounded-sm shadow-md  ${
                    currentDate === task.date
                      ? "border-l-2 border-green-500"
                      : "opacity-50"
                  }`}
                >
                  <button
                    className={`flex items-center justify-between text-xs w-full ${
                      taskSelected?.id === task.id
                        ? "bg-green-200/20"
                        : "bg-white/20"
                    }  min-h-[20px] mx-auto`}
                    onClick={() => handleTaskSelected(task)}
                    disabled={taskSelected?.id === task.id}
                  >
                    <p className="max-md:text-[10px] text-left relative pr-7">
                      {task.description}
                    </p>
                  </button>

                  <span className="text-xs absolute top-[24px] right-2">
                    {calculateTaskTime(task) || "00hr 00min"}
                  </span>
                  {currentDate !== task.date && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloneTask(task);
                      }}
                    >
                      <RefreshCcw size={16} />
                      {""}
                    </button>
                  )}
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
              value={taskValue}
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

            <Button type="submit" disabled={!taskValue || !categorySelected}>
              Add task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
