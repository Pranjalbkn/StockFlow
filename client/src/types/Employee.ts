export type Employee = {
  id: number;
  name: string;
  email: string;
  role: "MANAGER" | "SALESPERSON";
  is_active: boolean;
  created_at: string;
};
