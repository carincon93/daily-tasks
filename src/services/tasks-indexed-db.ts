import { Task } from "@/lib/types";
import { openDB, STORE_NAME } from "./conn-indexed-db";

const getTasks = async (): Promise<Task[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
  });
};

const addTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.add(task);
};

const updateTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(task);
};

const deleteTask = async (task: Task) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(task.id);
};

export { getTasks, addTask, updateTask, deleteTask };
