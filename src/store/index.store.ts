import { Session, Task } from "@/lib/types";
import { fetchSession, updateSession } from "@/services/tasks-graphql";
import { create } from "zustand";

type TimerStore = {
  sessionId: string;
  startTime: number | null;
  endOfDay: number | null;
  taskInProcess: Task | null;
  running: boolean;
  startTimer: (task: Task, isTaskSelected: boolean) => void;
  stopTimer: () => void;
};

type UserStore = {
  userId: string | null;
  setUserId: (userId: string | null) => void;
};

type GetCurrentDateStore = {
  currentDate: string;
  setCurrentDate: (currentDate: string) => void;
};

const getLastPathPart = () => {
  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];
  return lastPart !== "" && lastPart !== "daily-tasks-app" ? lastPart : "";
};

let userId = getLastPathPart();

const getSession = async () => {
  let userId = getLastPathPart();

  if (userId === "") return;

  return await fetchSession(userId);
};

const endOfDayUtc5 = (timestamp: number | null) => {
  if (!timestamp) return null;

  // Convertir a fecha en UTC-5 (Bogotá)
  const date = new Date(timestamp);

  // Extraer componentes en la zona horaria de Bogotá
  const utc5Time = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(utc5Time.find((p) => p.type === "year")?.value ?? "0");
  const month =
    Number(utc5Time.find((p) => p.type === "month")?.value ?? "1") - 1; // JS months are 0-indexed
  const day = Number(utc5Time.find((p) => p.type === "day")?.value ?? "1");

  // Crear nueva fecha a las 23:59:59.999 en UTC-5
  return new Date(Date.UTC(year, month, day, 23 + 5, 59, 59, 999));
};

// Global state with Zustand
export const useTimerStore = create<TimerStore>((set) => {
  // Initialize store
  getSession().then((session) => {
    if (session?.id) {
      set({ sessionId: session.id });
    }

    if (session?.start_time) {
      set({ startTime: session.start_time, running: true });
    }

    if (session?.end_of_day) {
      set({ endOfDay: session.end_of_day });
    }

    if (session?.task_in_process) {
      set({ taskInProcess: session.task_in_process });
    }
  });

  return {
    sessionId: "",
    startTime: null,
    endOfDay: null,
    taskInProcess: null,
    running: false,
    startTimer: async (task: Task, isTaskSelected: boolean) => {
      const session = await getSession();

      if (!session) return;

      const now = Date.now();

      const endOfDay = endOfDayUtc5(now)?.getTime().toString();

      if (isTaskSelected) {
        const sessionToUpdate: Partial<Session> = {
          id: session.id,
          start_time: now - task.milliseconds,
          end_of_day: Number(endOfDay),
          task_in_process: task,
          user_id: userId,
        };

        updateSession(sessionToUpdate);

        set({ startTime: now - task.milliseconds, running: true });
      } else {
        set({ startTime: session.start_time, running: true });
      }
    },
    stopTimer: async () => {
      const session = await getSession();
      const now = Date.now();

      if (!session) return;

      const endOfDay = endOfDayUtc5(now)?.getTime().toString();

      const sessionToUpdate: Partial<Session> = {
        id: session.id,
        start_time: null,
        end_of_day: Number(endOfDay),
        task_in_process: null,
        user_id: userId,
      };

      updateSession(sessionToUpdate);

      set({
        startTime: null,
        endOfDay: endOfDay ? Number(endOfDay) : null,
        running: false,
      });
    },
  };
});

export const getCurrentDate = create<GetCurrentDateStore>((set) => ({
  currentDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  setCurrentDate: (currentDate: string) => set({ currentDate }),
}));

export const useUserStore = create<UserStore>((set) => ({
  userId: userId,
  setUserId: (userId: string | null) => set({ userId }),
}));

export const sessionId = () => useTimerStore((state) => state.sessionId);
export const startTime = () => useTimerStore((state) => state.startTime);
export const endOfDay = () => useTimerStore((state) => state.endOfDay);
export const taskInProcess = () =>
  useTimerStore((state) => state.taskInProcess);
export const running = () => useTimerStore((state) => state.running);
export const startTimer = (task: Task, isTaskSelected: boolean) =>
  useTimerStore.getState().startTimer(task, isTaskSelected);
export const stopTimer = () => useTimerStore.getState().stopTimer();
