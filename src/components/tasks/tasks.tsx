import {
  useTimerStore,
  useUserStore,
  getCurrentDate,
  stopTimer,
} from "@/store/index.store";
import { Eraser, Pencil, RefreshCcw, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import { ChartLineMultiple } from "@/components/ChartLine";
import { Category, Task } from "@/lib/types";

import {
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  fetchCategories,
  fetchSession,
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Tasks() {
  const [taskSelected, setTaskSelected] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskValue, setTaskValue] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [categoryColor, setCategoryColor] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySelected, setCategorySelected] = useState<Partial<Category>>({
    id: "",
  });
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openUpdateTaskDialog, setOpenUpdateTaskDialog] = useState(false);
  const [taskSelectedToUpdate, setTaskSelectedToUpdate] = useState<Task>();

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

    if (taskSelected?.id !== task.id && startTime && taskSelected) {
      const newTaskMs = Date.now() - startTime;

      const taskToUpdate: Task = {
        id: taskSelected.id,
        milliseconds: newTaskMs,
        is_visible: taskSelected.is_visible,
        description: taskSelected.description,
        user_id: taskSelected.user_id,
        category: taskSelected.category,
        category_id: taskSelected.category_id,
        date: taskSelected.date,
      };

      handleUpdateTask(taskToUpdate);
    }

    startTimer(task, true);
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

  const handleUpdateTask = async (taskToUpdate: Task) => {
    if (!taskSelected || !startTime || !userId) return;

    updateTask(taskToUpdate).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleDeleteTask = async (task: Task) => {
    if (!task || !userId) return;

    deleteTask(task).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!category || !userId) return;

    deleteCategory(category).then(() =>
      setCategories((prevCategories) =>
        prevCategories.filter((c) => c.id !== category.id)
      )
    );
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAddTask();
    setTaskValue("");
    setCategorySelected({ id: "" });
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

  const handleAddCategory = async () => {
    if (!categoryValue) return;

    const newCategory: Partial<Category> = {
      name: categoryValue,
      color: categoryColor,
    };

    createCategory(newCategory).then((categoryAdded) => {
      setCategories((prevCategories) => [
        ...prevCategories,
        {
          id: categoryAdded.id,
          name: categoryAdded.name,
          color: categoryAdded.color,
        },
      ]);
    });

    setCategoryValue("");
    setCategorySelected({ id: "" });
  };

  useEffect(() => {
    if (!taskSelectedToUpdate) return;

    setOpenUpdateTaskDialog(true);
  }, [taskSelectedToUpdate]);

  useEffect(() => {
    if (categorySelected && categorySelected.id === "new") {
      setOpenCategoryDialog(true);
    }
  }, [categorySelected]);

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

  useEffect(() => {
    if (!userId) return;

    fetchSession(userId).then((session) => {
      if (session && session.task_in_process) {
        setTaskSelected(session.task_in_process);
        startTimer(session.task_in_process, false);
      }
    });

    fetchTasks(userId).then(setTasks);
    fetchCategories().then(setCategories);
  }, []);

  return (
    <div className="md:grid grid-cols-2 gap-4">
      <AlertDialog
        open={openCategoryDialog}
        onOpenChange={setOpenCategoryDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a category</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new category that will help you organize your
              tasks.
            </AlertDialogDescription>
            <ul className="text-xs">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-2 space-y-2"
                >
                  <span>{category.name}</span>

                  <button onClick={() => handleDeleteCategory(category)}>
                    <Trash2 size={14} />
                    {""}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-2">
              <Input
                placeholder="Enter a category name"
                onChange={(e) => setCategoryValue(e.target.value)}
              />

              <Input
                type="color"
                onChange={(e) => setCategoryColor(e.target.value)}
              />
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center gap-4">
            <AlertDialogCancel onClick={() => setCategorySelected({ id: "" })}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleAddCategory}
              disabled={!categoryValue}
            >
              Create category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openUpdateTaskDialog}
        onOpenChange={setOpenUpdateTaskDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update task</AlertDialogTitle>
            <AlertDialogDescription>
              Update the task details below to modify this task.
            </AlertDialogDescription>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Enter task description"
                type="text"
                value={taskSelectedToUpdate?.description}
                onChange={(e) =>
                  setTaskSelectedToUpdate((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />

              <Input
                placeholder="Minutes"
                type="number"
                min={0}
                step={0.1}
                onChange={(e) =>
                  setTaskSelectedToUpdate((prev) =>
                    prev
                      ? {
                          ...prev,
                          milliseconds: Number(e.target.value) * 1000 * 60,
                        }
                      : prev
                  )
                }
              />
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                taskSelectedToUpdate && handleUpdateTask(taskSelectedToUpdate);
              }}
            >
              Update task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="from-white/20 to-transparent bg-gradient-to-b p-4 rounded-2xl shadow-md border-x border-t border-gray-400 z-[6] relative">
        <ChartLineMultiple
          chartData={groupedTasksByCategory()}
          categories={categories}
        />
      </div>

      <div className="flex flex-col justify-between mt-4 md:mt-0">
        <ul
          className="space-y-2 h-[240px] overflow-y-auto md:h-[300px] 2xl:h-[480px]"
          style={{ scrollbarWidth: "none" }}
        >
          {tasks &&
            tasks
              .filter((task) => task.is_visible)
              .sort((a, b) => b.milliseconds - a.milliseconds)
              .map((task) => (
                <li key={task.id} className="relative text-black mb-4">
                  <button
                    className={`flex w-full p-3.5 border-l-3 rounded-sm shadow-md text-xs
                      ${currentDate !== task.date ? "opacity-50" : ""}
                      ${
                        taskSelected?.id === task.id
                          ? "bg-yellow-400 shadow-lg shadow-yellow-500/50 inset-shadow-white "
                          : "bg-white"
                      }
                      `}
                    style={{
                      borderColor: task.category.color || "#fbbf24",
                    }}
                    onClick={() => handleTaskSelected(task)}
                    disabled={taskSelected?.id === task.id}
                  >
                    <p className="text-left pr-7 text-yellow-900">
                      {task.description}
                    </p>
                  </button>

                  <div className="absolute right-2 top-0.5">
                    <div className="flex justify-center items-center gap-2">
                      {currentDate !== task.date && (
                        <button
                          type="button"
                          className="translate-y-1 hover:opacity-90"
                          onClick={() => {
                            handleCloneTask(task);
                          }}
                        >
                          <RefreshCcw size={16} />
                          {""}
                        </button>
                      )}

                      <button
                        onClick={() => setTaskSelectedToUpdate(task)}
                        className="mt-2"
                      >
                        <Pencil size={16} />
                        {""}
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task)}
                        type="button"
                        className="bg-yellow-700/70 text-white p-0.5 rounded shadow-md translate-y-1 hover:opacity-90"
                      >
                        <Eraser size={14} />
                        {""}
                      </button>
                    </div>
                    <span
                      className={`text-xs ${
                        taskSelected?.id === task.id
                          ? "bg-yellow-700 text-white "
                          : "bg-slate-200 opacity-60"
                      } py-0.5 px-2.5 rounded shadow-md translate-y-2.5 block`}
                    >
                      {calculateTaskTime(task) || "00hr 00min"}
                    </span>
                  </div>
                </li>
              ))}
        </ul>

        <form onSubmit={handleSubmit} className="space-y-2 mt-4 md:mt-0">
          <div className="text-xs grid grid-cols-2 gap-2">
            <Input
              className="!bg-white !text-black w-full"
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
              value={categorySelected?.id}
            >
              <SelectTrigger
                className="!bg-white !text-black w-full"
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

                <SelectItem value="new">New category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full bg-black text-white"
            type="submit"
            disabled={!taskValue || !categorySelected}
          >
            Add task
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
