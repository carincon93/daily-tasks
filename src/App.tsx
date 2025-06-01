import Tasks from "./components/tasks/tasks";
import { Timer } from "./components/timer";
import background from "/background.svg";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { createUser } from "./services/tasks-graphql";
import { User } from "./lib/types";
import Loading from "./components/Loader";
import { useUserStore } from "./store/index.store";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

const DialogUser = () => {
  const [openDialog, setOpenDialog] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUserId } = useUserStore();

  const navigate = useNavigate();

  const handleCreateUser = async () => {
    setLoading(true);
    createUser()
      .then((user: User) => {
        setUserId(user.id);
        navigate(`/daily-tasks-app/${user.id}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <Loading className="text-black dark:text-white" />
        </div>
      ) : (
        <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create an user</AlertDialogTitle>
              <AlertDialogDescription>
                You don't have a user created yet. Please click the create
                button to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleCreateUser}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

function App() {
  const { userId } = useUserStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/daily-tasks-app"
          element={<>{!userId && <DialogUser />}</>}
        />
        <Route
          path="/daily-tasks-app/:id"
          element={
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
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
