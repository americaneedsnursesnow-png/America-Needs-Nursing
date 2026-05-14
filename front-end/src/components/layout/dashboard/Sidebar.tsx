"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Package,
  MessageSquare,
  Mail,
  SquarePen,
  Layers,
  ShieldCheck,
  Flag,
  Trash2,
  LogOut,
  Menu,
  X,
  UserPen,
  UserPlus,
  Users,
  FileSpreadsheet,
  LayoutList,
} from "lucide-react";

import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import { useCommunityHubUnread } from "@/contexts/community-hub-unread-context";
import {
  type AuthUserRole,
  canAccessCommunity,
  getCommunityHubPath,
  getProfileUpdatePath,
} from "@/lib/api/auth-api";

type MenuItem = {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: readonly AuthUserRole[];
};

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["nurse", "company", "admin", "super_admin", "content_admin"],
  },
  { id: "change-profile", label: "Change profile", path: "/profile/update", icon: UserPen, roles: ["nurse", "company", "admin", "super_admin", "content_admin"] },
  { id: "community", label: "Community", path: "/community", icon: Users, roles: ["nurse", "super_admin"] },
  { id: "my-jobs", label: "My Jobs", path: "/dashboard/employee/my-jobs", icon: Briefcase, roles: ["nurse", "company", "admin"] },
  { id: "submit-job", label: "Create Jobs", path: "/dashboard/employee/submit-job", icon: PlusCircle, roles: ["nurse", "company", "admin"] },
  { id: "package", label: "Plans", path: "/dashboard/employee/package", icon: Package, roles: ["company"] },
  { id: "messages", label: "Inbox", path: "/dashboard/employee/messages", icon: MessageSquare, roles: ["nurse", "company", "admin"] },
  { id: "blog-write", label: "Blog Write", path: "/dashboard/admin/blogs-write", icon: SquarePen, roles: ["super_admin", "admin", "content_admin"] },
  { id: "newsletter", label: "Newsletter", path: "/dashboard/admin/newsletter", icon: Mail, roles: ["super_admin", "admin", "content_admin"] },
  { id: "tier-edit", label: "Job plans", path: "/dashboard/admin/edit-tiers", icon: Layers, roles: ["super_admin", "admin"] },
  { id: "company-verifies", label: "Pending Approvals", path: "/dashboard/admin/company-verified", icon: ShieldCheck, roles: ["super_admin", "admin"] },
  { id: "community-moderation", label: "Community moderation", path: "/dashboard/admin/community-moderation", icon: Flag, roles: ["super_admin", "admin"] },
  { id: "create-staff-admin", label: "Create content / super admin", path: "/dashboard/admin/create-staff-admin", icon: UserPlus, roles: ["super_admin"] },
  { id: "nurse-csv-import", label: "Import nurses (CSV)", path: "/dashboard/admin/nurse-csv-import", icon: FileSpreadsheet, roles: ["super_admin", "admin"] },
  { id: "user-directory", label: "Nurses & employers", path: "/dashboard/admin/user-directory", icon: LayoutList, roles: ["super_admin", "admin"] },
];

function roleLabel(role: AuthUserRole): string {
  const labels: Record<string, string> = {
    super_admin: "Super admin",
    admin: "Admin",
    content_admin: "Content admin",
    company: "Company",
    nurse: "Nurse",
  };
  return labels[role] || role;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { communityUnread, messagesUnread } = useCommunityHubUnread();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const visibleMenuItems = menuItems.filter((item) => {
    if (!user || !item.roles.includes(user.role)) return false;
    if (item.id === "community") {
      return canAccessCommunity(user.role, { communityBannedAt: user.communityBannedAt });
    }
    return true;
  });

  function handleLogout() {
    logout();
    router.push("/");
    router.refresh();
  }

  const displayName = user?.fullName?.trim() || user?.email || "Account";
  const email = user?.email ?? "";
  const showNotificationBell = user?.role === "nurse";

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed left-4 top-4 z-[60] lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded-xl bg-red-600 p-2.5 text-white shadow-lg transition-all active:scale-95"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop Overlay (Mobile only) */}
      <div
        className={`fixed inset-0 z-[40] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Aside */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[50] flex h-full w-72 flex-col border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* User Profile Section */}
        <div className="flex flex-shrink-0 flex-col items-center border-b border-gray-50 p-6 pt-20 lg:pt-8">
          {ready && user ? (
            <>
              <div className="relative mx-auto mb-4 w-fit">
                <UserAvatar
                  email={email}
                  displayName={displayName}
                  photoUrl={user.profilePhotoUrl}
                  size={80}
                  className="!ring-4 !ring-red-50"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  {showNotificationBell ? (
                    <NotificationBellLink className="h-9 w-9 bg-white shadow-md ring-1 ring-slate-100" />
                  ) : null}
                </div>
              </div>
              <h3 className="w-full truncate px-2 text-center text-lg font-bold text-gray-900">
                {displayName}
              </h3>
              <p className="mt-0.5 w-full truncate px-2 text-center text-xs text-gray-400">
                {email}
              </p>
              <span className="mt-3 rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-600">
                {roleLabel(user.role)}
              </span>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-400 animate-pulse">Loading profile...</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {visibleMenuItems.map((item) => {
            const href =
              item.id === "community" && user
                ? getCommunityHubPath(user.role, { communityBannedAt: user.communityBannedAt })
                : item.id === "change-profile" && user
                ? getProfileUpdatePath(user.role)
                : item.path;
            
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={item.id}
                href={href}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <item.icon size={20} className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-red-600"}`} />
                <span className="truncate">{item.label}</span>
                
                {/* Notification Dots */}
                {((item.id === "community" && communityUnread) || (item.id === "messages" && messagesUnread)) && (
                  <span className="absolute right-3 top-1/2 flex size-2.5 -translate-y-1/2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="space-y-1 border-t border-gray-50 bg-gray-50/50 p-4">
          <Link
            href="/dashboard/employee/delete-account"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={18} />
            <span>Delete Account</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-white hover:text-gray-900"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Global CSS for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e5e7eb;
        }
      `}</style>
    </>
  );
}