import { DashboardAccessGuard } from "@/components/auth/dashboard-access-guard";
import Sidebar from "@/components/layout/dashboard/Sidebar";
import { DashboardEmployerCompleteProfileModal } from "@/features/onboarding/dashboard-employer-complete-profile-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAccessGuard>
      <div className="min-h-screen bg-slate-50/80">
        <a href="#dashboard-main" className="skip-link">
          Skip to dashboard content
        </a>
        <Sidebar />

        <main
          id="dashboard-main"
          className="min-h-screen min-w-0 w-full overflow-y-auto transition-[padding] duration-300 ease-in-out lg:pl-72"
          tabIndex={-1}
        >
          {children}
        </main>
        <DashboardEmployerCompleteProfileModal />
      </div>
    </DashboardAccessGuard>
  );
}