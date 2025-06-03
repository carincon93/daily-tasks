import { create } from "zustand";

type TimerStore = {
  startTime: number | null;
  endOfDay: number | null;
  running: boolean;
  startTimer: (taskMilliseconds: number) => void;
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

const getBrowserStorage = (key: string) => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key);
  }
  return null;
};

// const removeItemBrowserStorage = (key: string) => {
//   if (typeof window !== "undefined") {
//     return window.localStorage.removeItem(key);
//   }

//   return null;
// };

// Global state with Zustand
export const useTimerStore = create<TimerStore>((set) => ({
  startTime: Number(getBrowserStorage("startTime")) || null,
  endOfDay: Number(getBrowserStorage("endOfDay")) || null,
  running: Boolean(getBrowserStorage("startTime")),
  startTimer: (taskMilliseconds: number = 0) => {
    const now = Date.now() - taskMilliseconds;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("startTime", now.toString());
    }
    set({ startTime: now, running: true });
  },
  stopTimer: () => {
    // Convertir a fecha en UTC-5 (Bogotá)
    const date = new Date(Number(getBrowserStorage("startTime")));

    // Extraer componentes en la zona horaria de Bogotá
    const bogotaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = Number(
      bogotaTime.find((p) => p.type === "year")?.value ?? "0"
    );
    const month =
      Number(bogotaTime.find((p) => p.type === "month")?.value ?? "1") - 1; // JS months are 0-indexed
    const day = Number(bogotaTime.find((p) => p.type === "day")?.value ?? "1");

    // Crear nueva fecha a las 23:59:59.999 en UTC-5
    const endOfDayBogota = new Date(
      Date.UTC(year, month, day, 23 + 5, 59, 59, 999)
    );
    window.localStorage.setItem(
      "endOfDay",
      endOfDayBogota.getTime().toString()
    );

    // removeItemBrowserStorage("startTime");
    // removeItemBrowserStorage("endOfDay");
    // removeItemBrowserStorage("taskInProcess");

    set({ startTime: null, endOfDay: null, running: false });
  },
}));

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

export const startTime = () => useTimerStore((state) => state.startTime);
export const endOfDay = () => useTimerStore((state) => state.endOfDay);
export const running = () => useTimerStore((state) => state.running);
export const startTimer = (taskMilliseconds: number) =>
  useTimerStore.getState().startTimer(taskMilliseconds);
export const stopTimer = () => useTimerStore.getState().stopTimer();
