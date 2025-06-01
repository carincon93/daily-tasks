const fetchCategories = async () => {
  const response = await fetch(import.meta.env.VITE_HASURA_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": import.meta.env.VITE_HASURA_ADMIN_SECRET,
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
  console.log(result.data.categories);
};

export { fetchCategories };
