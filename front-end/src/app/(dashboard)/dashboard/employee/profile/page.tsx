"use client";

import { ProfileUpdateForm } from "@/features/profile-update";
import { useAuth } from "@/contexts/auth-context";

export default function EmployerDashboardProfilePage() {
  const { user, ready } = useAuth();

  // Loading State - Full Screen
  if (!ready || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-red-50 border-t-red-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold tracking-widest text-red-600 uppercase">
          Initializing...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-5xl min-h-screen ">
      {/* Top Brand Accent Line */}

      {/* Main Wrapper - Full Width */}
      <div className="w-full px-2 sm:px-6 lg:px-10 py-6 lg:py-10">
        
        {/* Header - Full Width with Bottom Border */}
        <div className="w-full mb-5 pb-3 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
              
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                  Account Profile
                </h1>
              </div>
              <p className="text-gray-500 text-lg font-medium">
                Manage your public presence and account security.
              </p>
            </div>

            {/* User Meta Box */}
            
          </div>
        </div>

        {/* Content Area - Full Width Container */}
        <div className="w-full">
          <div className="relative w-full bg-white  rounded-xl shadow-2xl shadow-red-900/5">
            {/* Subtle Inner Accent */}
            
            <div className="p-2 md:p-4 lg:p-6">
              <div className="w-full">
                {/* 
                   The form will now expand to the full width of the screen 
                   minus the padding of this container.
                */}
                <ProfileUpdateForm />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Footer */}
        <div className="mt-16 w-full pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} Employer Portal • System Secure
          </p>
          <div className="flex items-center gap-8">
            <button className="text-xs font-black text-gray-500 hover:text-red-600 transition-colors uppercase tracking-widest">
              Security
            </button>
            <button className="text-xs font-black text-red-600 hover:underline uppercase tracking-widest underline-offset-4">
              Help Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}