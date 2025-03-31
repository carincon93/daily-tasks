import { create } from "zustand";

interface TimerStore {
  startTime: number | null;
  running: boolean;
  startTimer: () => void;
  stopTimer: () => void;
}

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

export const startTime = () => useTimerStore((state) => state.startTime);
export const running = () => useTimerStore((state) => state.running);
export const startTimer = () => useTimerStore.getState().startTimer();
export const stopTimer = () => useTimerStore.getState().stopTimer();
