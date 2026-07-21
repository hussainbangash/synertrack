export const demoAccounts = [
  {
    id: "admin",
    label: "Admin Demo",
    email: "admin@demo.com",
    password: "password123",
  },
  {
    id: "manager",
    label: "Manager Demo",
    email: "manager@demo.com",
    password: "password123",
  },
  {
    id: "user",
    label: "User Demo",
    email: "user@demo.com",
    password: "password123",
  },
] as const;

export function getDemoAccount(id: string | string[] | undefined) {
  const selectedId = Array.isArray(id) ? id[0] : id;

  return (
    demoAccounts.find((account) => account.id === selectedId) ?? demoAccounts[0]
  );
}
