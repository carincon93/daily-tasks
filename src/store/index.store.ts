import { Session, Task } from "@/lib/types";
import {
  createSession,
  fetchSession,
  updateSession,
} from "@/services/tasks-graphql";
import { create } from "zustand";

type TimerStore = {
  sessionId: string;
  startTime: number | null;
  endOfDay: number | null;
  taskInProcess: Task | null;
  running: boolean;
  startTimer: (task: Task) => void;
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

const getSession = async () => {
  return await fetchSession();
};

const endOfDayUtc5 = (timestamp: number) => {
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
    startTimer: async (task: Task) => {
      const session = await getSession();

      const now = Date.now();

      const endOfDay = endOfDayUtc5(now).getTime().toString();

      if (!session) {
        const newSession: Partial<Session> = {
          start_time: now,
          end_of_day: Number(endOfDay),
          task_in_process: task,
        };

        createSession(newSession);
      }

      const sessionToUpdate: Partial<Session> = {
        id: session.id,
        start_time: now,
        end_of_day: Number(endOfDay),
        task_in_process: task,
      };

      updateSession(sessionToUpdate);

      const startTimeCalc = now - task.milliseconds;

      set({ startTime: startTimeCalc, running: true });
    },
    stopTimer: async () => {
      const session = await getSession();

      const endOfDay = endOfDayUtc5(session.start_time).getTime().toString();

      const sessionToUpdate: Partial<Session> = {
        id: session.id,
        start_time: session.start_time,
        end_of_day: Number(endOfDay),
        task_in_process: null,
      };

      updateSession(sessionToUpdate);

      set({ startTime: null, endOfDay: null, running: false });
    },
  };
});

export const getCurrentDate = create<GetCurrentDateStore>((set) => ({
  currentDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  setCurrentDate: (currentDate: string) => set({ currentDate }),
}));

const pathParts = window.location.pathname.split("/");
const lastPart = pathParts[pathParts.length - 1];

export const useUserStore = create<UserStore>((set) => ({
  userId: lastPart !== "" && lastPart !== "daily-tasks-app" ? lastPart : null,
  setUserId: (userId: string | null) => set({ userId }),
}));

export const sessionId = () => useTimerStore((state) => state.sessionId);
export const startTime = () => useTimerStore((state) => state.startTime);
export const endOfDay = () => useTimerStore((state) => state.endOfDay);
export const taskInProcess = () =>
  useTimerStore((state) => state.taskInProcess);
export const running = () => useTimerStore((state) => state.running);
export const startTimer = (task: Task) =>
  useTimerStore.getState().startTimer(task);
export const stopTimer = () => useTimerStore.getState().stopTimer();
