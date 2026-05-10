"use client";

import React, { useState } from "react";
import { 
  UserCircle, 
  Loader2, 
  Settings2, 
  Mail,
  Fingerprint,
  LayoutDashboard,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

import { ProfileUpdateForm } from "@/features/profile-update";
import { useAuth } from "@/contexts/auth-context";

type TabType = "overview" | "edit";

export default function AdminDashboardProfilePage() {
  const { user, ready } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white animate-in fade-in duration-500">
      {/* 1. FULL WIDTH HEADER */}
      <div className="w-full px-6 py-8 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Profile
        </h1>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="w-full border-b border-slate-100">
        <div className="flex px-6 gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "overview" 
              ? "border-red-600 text-red-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "edit" 
              ? "border-red-600 text-red-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* 3. FULL WIDTH CONTENT */}
      <div className="w-full p-6">
        {activeTab === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SummaryCard 
                icon={<Mail className="text-red-600" />} 
                label="Primary Email" 
                value={user.email} 
              />
              <SummaryCard 
                icon={<ShieldCheck className="text-red-600" />} 
                label="Role" 
                value="System Administrator" 
              />
              <SummaryCard 
                icon={<Fingerprint className="text-red-600" />} 
                label="Account ID" 
                value={`ID-${user.email.split('@')[0].toUpperCase()}`} 
              />
            </div>

            <div className="w-full p-8 bg-slate-50 rounded-2xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-2">Account Security</h3>
               <p className="text-slate-500 text-sm">
                 Your account is currently active and synced. All administrative actions are being logged under your ID.
               </p>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="max-w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="max-w-full">
              <ProfileUpdateForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 
 * REUSABLE COMPONENTS
 */

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-full p-6 rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-base font-bold text-slate-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}