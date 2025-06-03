type Task = {
  id: number;
  category_id: string;
  category: Category;
  user_id: string;
  description: string;
  milliseconds: number;
  date: string;
  is_visible: boolean;
};

type User = {
  id: string;
};

type Category = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  start_time: number;
  end_of_day: number;
  task_in_process: Task | null;
}

export type { User, Task, Category, Session };
