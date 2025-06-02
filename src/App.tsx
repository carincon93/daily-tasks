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
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

const DialogUser = () => {
  const [openDialog, setOpenDialog] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUserId, userId } = useUserStore();

  const navigate = useNavigate();

  const handleCreateUser = async () => {
    setLoading(true);
    createUser()
      .then((user: User) => {
        setUserId(user.id);
        navigate(`/${user.id}`);
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
                If you do not yet have a username. Please click on the create
                user button to continue or if you already have a user enter the
                user code.
              </AlertDialogDescription>
              <div className="flex items-center justify-center gap-2">
                <Input
                  placeholder="Enter your user code"
                  onChange={(e) => setUserId(e.target.value)}
                />
                <Button
                  onClick={() => navigate(`/${userId}`)}
                  disabled={!userId}
                >
                  Go
                </Button>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex items-center gap-4">
              <span className="text-gray-600">- or -</span>
              <AlertDialogAction
                onClick={handleCreateUser}
                disabled={Boolean(userId)}
              >
                Create user
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

function App() {
  return (
    <BrowserRouter basename="/daily-tasks-app">
      <Routes>
        <Route path="/" element={<DialogUser />} />
        <Route
          path="/:id"
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
