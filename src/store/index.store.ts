import { User } from "@/lib/types";
import { create } from "zustand";

type TimerStore = {
  startTime: number | null;
  running: boolean;
  startTimer: () => void;
  stopTimer: () => void;
};

type UserStore = {
  userId: string | null;
  setUserId: (userId: string | null) => void;
};

const getBrowserStorage = (key: string) => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key);
  }
  return null;
};

// Global state with Zustand
export const useTimerStore = create<TimerStore>((set) => ({
  startTime: Number(getBrowserStorage("startTime")) || null,
  running: Boolean(getBrowserStorage("startTime")),
  startTimer: () => {
    const now = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("startTime", now.toString());
    }
    set({ startTime: now, running: true });
  },
  stopTimer: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("startTime");
    }
    set({ startTime: null, running: false });
  },
}));

const pathParts = window.location.pathname.split("/");
const lastPart = pathParts[pathParts.length - 1];

export const useUserStore = create<UserStore>((set) => ({
  userId: lastPart !== "" && lastPart !== "daily-tasks-app" ? lastPart : null,
  setUserId: (userId: string | null) => set({ userId }),
}));

export const startTime = () => useTimerStore((state) => state.startTime);
export const running = () => useTimerStore((state) => state.running);
export const startTimer = () => useTimerStore.getState().startTimer();
export const stopTimer = () => useTimerStore.getState().stopTimer();
