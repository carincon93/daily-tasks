import Tasks from "./components/tasks/tasks";
import { Timer } from "./components/timer";
import background from "/background.svg";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  return (
    <>
      <ThemeToggle />
      <img
        id="background"
        src={background}
        alt="background"
        fetchPriority="high"
      />

      <div className="min-h-[inherit] p-4 space-y-10 lg:grid lg:grid-cols-2 lg:gap-4 relative z-10 dark:text-white">
        <div className="boxes-pattern absolute size-full inset-0 -z-1"></div>

        <Timer />
        <Tasks />
      </div>
    </>
  );
}

export default App;
