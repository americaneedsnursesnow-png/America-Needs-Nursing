"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Flag,
  LayoutList,
  Layers,
  Loader2,
  Mail,
  ShieldCheck,
  SquarePen,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import {
  canAccessBlogNewsletterAdmin,
  canProvisionAdminAccounts,
  isFullOpsAdmin,
  type AuthUserRole,
} from "@/lib/api/auth-api";

type HubLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  visible: (role: AuthUserRole) => boolean;
};

const LINKS: HubLink[] = [
  {
    href: "/dashboard/admin/blogs-write",
    title: "Blog",
    description: "Create and edit blog posts.",
    icon: SquarePen,
    visible: (r) => canAccessBlogNewsletterAdmin(r),
  },
  {
    href: "/dashboard/admin/newsletter",
    title: "Newsletter",
    description: "Send newsletter broadcasts.",
    icon: Mail,
    visible: (r) => canAccessBlogNewsletterAdmin(r),
  },
  {
    href: "/dashboard/admin/create-staff-admin",
    title: "Create content or super admin",
    description: "Add content admins (blog + newsletter) or other super admins.",
    icon: UserPlus,
    visible: (r) => canProvisionAdminAccounts(r),
  },
  {
    href: "/dashboard/admin/edit-tiers",
    title: "Job packages",
    description: "Manage pricing tiers and job packages.",
    icon: Layers,
    visible: (r) => isFullOpsAdmin(r),
  },
  {
    href: "/dashboard/admin/company-verified",
    title: "Pending approvals",
    description: "Review employer verification requests.",
    icon: ShieldCheck,
    visible: (r) => isFullOpsAdmin(r),
  },
  {
    href: "/dashboard/admin/community-moderation",
    title: "Community moderation",
    description: "Moderate community content.",
    icon: Flag,
    visible: (r) => isFullOpsAdmin(r),
  },
  {
    href: "/dashboard/admin/nurse-csv-import",
    title: "Import nurses (CSV)",
    description: "Bulk-import nurse emails from a file.",
    icon: FileSpreadsheet,
    visible: (r) => isFullOpsAdmin(r),
  },
  {
    href: "/dashboard/admin/user-directory",
    title: "Nurses & employers",
    description: "Browse and manage user accounts.",
    icon: LayoutList,
    visible: (r) => isFullOpsAdmin(r),
  },
  {
    href: "/dashboard/admin/community",
    title: "Community (admin)",
    description: "Open the community hub as super admin.",
    icon: Users,
    visible: (r) => r === "super_admin",
  },
];

export default function AdminDashboardHomePage() {
  const { user, ready } = useAuth();

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" aria-hidden />
      </div>
    );
  }

  const role = user.role;
  const visible = LINKS.filter((l) => l.visible(role));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Tools available for your role are listed below. Use the sidebar for quick access
          to any screen you are allowed to open.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
              <item.icon size={22} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          </Link>
        ))}

        <Link
          href="/dashboard/admin/profile"
          className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-800 group-hover:text-white">
            <ShieldCheck size={22} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">Profile & settings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update your admin account and security settings.
            </p>
          </div>
        </Link>
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">
          No additional tools matched this role. Use{" "}
          <Link href="/dashboard/admin/profile" className="font-medium text-red-600 underline">
            Profile
          </Link>{" "}
          or the sidebar.
        </p>
      )}
    </div>
  );
}
