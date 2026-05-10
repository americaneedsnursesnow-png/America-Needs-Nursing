import type { ReactNode } from "react";

import { RequireProvisionAdmin } from "@/components/layout/dashboard/require-provision-admin";

export default function CreateStaffAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <RequireProvisionAdmin>{children}</RequireProvisionAdmin>;
}
