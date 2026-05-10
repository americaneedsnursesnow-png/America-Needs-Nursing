// types/employee.ts
export interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export const mockEmployees: Employee[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${i + 1}`,
  role: i % 2 === 0 ? 'Designer' : 'Developer',
  email: `emp${i + 1}@company.com`,
  status: i % 3 === 0 ? 'Inactive' : 'Active',
}));