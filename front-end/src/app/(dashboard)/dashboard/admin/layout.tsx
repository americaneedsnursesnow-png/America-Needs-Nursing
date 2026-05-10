import { RequireStaffAdmin } from "@/components/layout/dashboard/require-staff-admin";

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireStaffAdmin>{children}</RequireStaffAdmin>;
}

