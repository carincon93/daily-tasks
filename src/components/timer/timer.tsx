import { useTimerStore } from "@/store/index.store";
import { useEffect, useState } from "react";
import Loading from "@/components/Loader";

export function Timer() {
  const { startTime, running } = useTimerStore();
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!running || !startTime) return;

    const updateElapsedTime = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000)); // In seconds
    };

    updateElapsedTime(); // Calculate when the page has loaded

    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [running, startTime]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Number(((elapsedTime - 30) / 60).toFixed(0)) - 60 * hours;
  const seconds = elapsedTime ? (elapsedTime % 60).toString() : "00";

  const date = new Date(Date.now() - (5 * 60 * 60 * 1000));
  const formattedDate = date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "America/New_York",
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loading className="text-black dark:text-white" />
      </div>
    );

  return (
    <div className="flex items-center justify-center space-y-4 p-4 rounded-lg shadow-md bg-slate-300/70 backdrop-blur-2xl border-amber-400 border text-slate-800 fixed bottom-0 left-0 right-0 mx-auto z-50 w-fit">
      <img
        src="/daily-tasks-app/emojis/watch.png"
        alt="timer"
        className="size-8 md:size-12 mb-0 mr-2 object-contain"
      />

      <div className="flex items-center justify-center space-x-4 md:text-3xl font-bold">
        <div>
          {hours.toString().padStart(2, "0")}:
          {minutes < 0 ? "00" : minutes.toString().padStart(2, "0")}:
          {seconds.padStart(2, "0")}
        </div>

        <div className="text-center">📆 {formattedDate}</div>
      </div>
    </div>
  );
}
