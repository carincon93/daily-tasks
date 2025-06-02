import { Category, Task, User } from "@/lib/types";

const API_URL = import.meta.env.VITE_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

const fetchTasks = async (user_id: string): Promise<Task[]> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
          query get_tasks_by_user($user_id: uuid!) {
            tasks(where: {user_id: {_eq: $user_id}}) {
              id
              category_id
              user_id
              description
              milliseconds
            }
          }
        `,
      variables: {
        user_id,
      },
    }),
  });

  const result = await response.json();
  return result.data.tasks;
};

const createTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_task($object: tasks_insert_input!) {
          insert_tasks_one(object: $object) {
            id
            category_id
            user_id
            description
            milliseconds
          }
        }
      `,
      variables: {
        object: {
          category_id: task.category_id,
          user_id: task.user_id,
          description: task.description,
          milliseconds: 0,
        },
      },
    }),
  });

  const result = await response.json();

  return result.data.insert_tasks_one;
};

const findTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        query get_task_by_pk($id: uuid!) {
          tasks(where: {id: {_eq: $id}}, limit: 1) {
            milliseconds
          }
        }
      `,
      variables: {
        id: task.id,
      },
    }),
  });

  const result = await response.json();

  return result.data.tasks[0];
};

const updateTask = async (
  task: Partial<Task>,
  newMilliseconds: number
): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation update_single_task($id: uuid!, $milliseconds: bigint) {
          update_tasks_by_pk(pk_columns: {id: $id}, _set: {milliseconds: $milliseconds}) {
            id
            category_id
            user_id
            description
            milliseconds
          }
        }
      `,
      variables: {
        id: task.id,
        milliseconds: newMilliseconds,
      },
    }),
  });

  const result = await response.json();

  return result.data.update_tasks_by_pk;
};

const deleteTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation delete_single_task($id: uuid!) {
          delete_tasks_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: task.id,
      },
    }),
  });

  const result = await response.json();

  return result.data.delete_tasks_by_pk;
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
          query get_categories {
            categories {
              id
              name
            }
          }
        `,
    }),
  });

  const result = await response.json();
  return result.data.categories;
};

const createUser = async (): Promise<User> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_user {
          insert_users_one(object: {}) {
            id
          }
        }
      `,
      variables: {},
    }),
  });

  const result = await response.json();

  return result.data.insert_users_one;
};

export {
  fetchCategories,
  fetchTasks,
  createTask,
  findTask,
  updateTask,
  deleteTask,
  createUser,
};
