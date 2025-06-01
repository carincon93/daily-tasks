type Task = {
  id: number;
  category_id: string;
  user_id: string;
  description: string;
  milliseconds: number;
};

type User = {
  id: string;
};

type Category = {
  id: string;
  name: string;
}

export type { User, Task, Category };
