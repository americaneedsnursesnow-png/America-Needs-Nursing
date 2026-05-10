import { RequireSuperAdmin } from "@/components/layout/dashboard/require-super-admin";

export default function AdminCommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSuperAdmin>{children}</RequireSuperAdmin>;
}
