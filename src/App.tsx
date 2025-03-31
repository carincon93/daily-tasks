import Tasks from "./components/tasks/tasks";
import { Timer } from "./components/timer";
import background from "/background.svg";
import "./App.css";

function App() {
  return (
    <>
      <img id="background" src={background} alt="background" />
      <div className="min-h-[inherit] p-4 space-y-10 lg:grid lg:grid-cols-2 lg:gap-4 relative z-10">
        <Timer />
        <Tasks />
      </div>
    </>
  );
}

export default App;
