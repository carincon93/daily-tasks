import { useTimerStore } from "../../store/index.store";
import { Timer as TimerIcon } from "lucide-react";
import { useEffect, useState } from "react";

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

  if (loading) return <div>Loading</div>;

  return (
    <div className="dark:from-gray-800 to-transparent bg-gradient-to-b flex flex-col items-center justify-center space-y-4 max-lg:p-8 rounded-2xl shadow-md border-x border-t border-gray-400 min-h-[30dvh] h-full">
      {/* <h1 className="text-4xl">Stopwatch</h1> */}
      <TimerIcon className="size-12" />

      <div className="flex space-x-4 text-4xl">
        <div>
          {hours.toString().padStart(2, "0")}:
          {minutes < 0 ? "00" : minutes.toString().padStart(2, "0")}:
          {seconds.padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
