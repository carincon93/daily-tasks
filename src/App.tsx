import Tasks from "./components/tasks/tasks";
import { Timer } from "./components/timer";
import background from "/background.svg";
import "./App.css";

function App() {
  return (
    <>
      <img
        id="background"
        src={background}
        alt="background"
        fetchPriority="high"
      />
      <img
        className="absolute inset-0 mx-auto opacity-30 top-[36%] lg:top-[20%] w-7/12 lg:w-4/12"
        src="./TaskList.webp"
        alt="TaskList"
      />
      <div className="min-h-[inherit] p-4 space-y-10 lg:grid lg:grid-cols-2 lg:gap-4 relative z-10 dark:text-white">
        <Timer />
        <Tasks />
      </div>
    </>
  );
}

export default App;
