"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";

type ProfileUpdatePageShellProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  contentMaxClass?: string;
  standalone?: boolean;
  children: ReactNode;
};

export function ProfileUpdatePageShell({
  backHref,
  backLabel,
  title,
  description,
  contentMaxClass = "max-w-7xl", // Increased for better professional width
  standalone = false,
  children,
}: ProfileUpdatePageShellProps) {
  const { user, ready } = useAuth();

  return (
    <div className={`w-full bg-[#fcfcfd] transition-all duration-500 ${standalone ? "min-h-screen" : "min-h-full"}`}>
      {/* Content Container */}
      <div className={`mx-auto ${contentMaxClass} px-4 sm:px-6 lg:px-8`}>
        <div className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-red-600"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                {backLabel}
              </Link>
              {ready && user && (
                <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600 ring-1 ring-emerald-600/10">
                  <ShieldCheck size={10} />
                  SECURE
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="mt-6 pb-12">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>

      </div>

      {/* Compact Status Indicator */}
      <div className="fixed bottom-4 right-4 hidden sm:block">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 p-2 px-3 shadow-sm backdrop-blur-md">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
            Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}