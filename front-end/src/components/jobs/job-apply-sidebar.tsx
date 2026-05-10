"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { 
  FileText, Loader2, X, ChevronRight, CheckCircle2, 
  Briefcase, Info, AlertCircle, UploadCloud, ShieldCheck 
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { applyToJob } from "@/lib/api/applications-api";
import {
  jobRoleDetailEntries,
  type JobEmploymentType,
  type JobLevel,
} from "@/lib/job-posting-metadata";
import {
  getMyNurseProfile,
  uploadMyNurseResumePdf,
  type NurseProfileResponse,
} from "@/lib/api/nurse-profile-api";

type JobApplySidebarProps = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobSlug: string;
  roleDetails?: {
    jobCategory?: string | null;
    employmentType?: JobEmploymentType | null;
    jobLevel?: JobLevel | null;
    location?: string | null;
  };
};

const PROFILE_FETCH_TIMEOUT_MS = 18_000;

export function JobApplySidebar({
  jobId,
  jobTitle,
  companyName,
  jobSlug,
  roleDetails,
}: JobApplySidebarProps) {
  const { user, accessToken, ready } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [nurseProfile, setNurseProfile] = useState<NurseProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);

  const isNurse = user?.role === "nurse";
  const roleRows = roleDetails ? jobRoleDetailEntries(roleDetails) : [];

  const loadNurseProfile = useCallback(async () => {
    if (!accessToken) return;
    setProfileLoading(true);
    let timeoutId: number | undefined;
    try {
      const p = await Promise.race([
        getMyNurseProfile(accessToken).finally(() => {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        }),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("Timeout")), PROFILE_FETCH_TIMEOUT_MS);
        }),
      ]);
      setNurseProfile(p);
    } catch (err) {
      setNurseProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (modalOpen && accessToken && isNurse) void loadNurseProfile();
  }, [modalOpen, accessToken, isNurse, loadNurseProfile]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setResumeUploading(true);
    try {
      await uploadMyNurseResumePdf(accessToken, file);
      await loadNurseProfile(); 
    } catch (err) {
      setError("Failed to upload resume.");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !isNurse) return;
    setError(null);
    setSubmitting(true);
    try {
      await applyToJob(accessToken, jobId, { coverLetter: coverLetter.trim() || undefined });
      setSuccess(true);
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* SIDEBAR BOX */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Briefcase size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Apply to Position</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">{jobTitle}</p>

          <div className="mt-8 space-y-4">
            {success ? (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-5 text-green-700 border border-green-100">
                <CheckCircle2 className="size-5 shrink-0" />
                <p className="text-sm font-black uppercase tracking-tight text-green-800">Application Sent</p>
              </div>
            ) : !ready ? (
              <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-100" />
            ) : !user ? (
              <Link
                href={`/sign-in?next=${encodeURIComponent(`/jobs/${jobSlug}`)}`}
                className="flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-red-600 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 shadow-lg shadow-red-200"
              >
                Sign in to Apply <ChevronRight size={16} />
              </Link>
            ) : !isNurse ? (
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex gap-3">
                <Info className="text-slate-400 shrink-0" size={18} />
                <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed text-center">Candidate access only</p>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="group flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-red-600 py-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-800 hover:-translate-y-0.5"
              >
                Apply Now <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CENTERED MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
          <div 
            className="relative flex h-auto max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">Application Details</h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">{companyName}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-slate-50 p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body - SCROLLBAR HIDDEN */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Position Info Grid */}
              <div className="grid grid-cols-2 gap-6 rounded-[2rem] bg-slate-50 p-7 border border-slate-100">
                {roleRows.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{row.label}</p>
                    <p className="text-sm font-black text-slate-800">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Resume Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Professional Resume</h4>
                  {profileLoading && <Loader2 className="animate-spin text-red-600" size={16} />}
                </div>

                <div className={`relative flex items-center justify-center rounded-[2rem] border-2 border-dashed p-8 transition-all ${
                  nurseProfile?.resumeUrl ? "border-green-100 bg-green-50/40" : "border-slate-200 bg-slate-50/50"
                }`}>
                  {resumeUploading ? (
                    <div className="py-2 text-center">
                      <Loader2 className="mx-auto animate-spin text-red-600 mb-2" size={24} />
                      <p className="text-[10px] font-black uppercase text-slate-500">Processing PDF...</p>
                    </div>
                  ) : nurseProfile?.resumeUrl ? (
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-white p-3 text-green-600 shadow-sm ring-1 ring-green-100"><CheckCircle2 size={24} /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Resume Attached</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">Synchronized with profile</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="rounded-lg border border-red-100 bg-white px-4 py-2 text-[10px] font-black uppercase text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 py-4 group"
                    >
                      <div className="rounded-full bg-white p-4 shadow-sm group-hover:scale-110 transition-transform ring-1 ring-slate-100"><UploadCloud className="text-slate-400" size={32} /></div>
                      <p className="text-xs font-black uppercase text-slate-600 tracking-tight">Select Resume PDF</p>
                    </button>
                  )}
                  <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                </div>
                {!nurseProfile?.resumeUrl && !resumeUploading && (
                  <p className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase italic px-2">
                    <AlertCircle size={14} /> Resume upload required
                  </p>
                )}
              </div>

              {/* Cover Letter Box */}
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-900 uppercase tracking-tight">Introduction <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the hospital why you're the perfect candidate..."
                  className="w-full rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm font-medium text-slate-700 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/5 transition-all"
                />
              </div>
            </div>

            {/* Bottom Fixed Action Bar */}
            <div className="border-t border-slate-50 bg-white p-8">
              {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-[10px] font-black text-red-600 uppercase tracking-tight">{error}</div>}
              <button
                type="button"
                onClick={handleApply}
                disabled={submitting || !nurseProfile?.resumeUrl || resumeUploading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-red-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-red-800 disabled:opacity-20 disabled:grayscale"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                Confirm Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}