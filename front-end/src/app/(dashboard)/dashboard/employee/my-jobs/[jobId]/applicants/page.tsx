"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Mail, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  User
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  fetchEmployerApplicationNurseResumePdf,
  listApplicationsForJob,
  updateEmployerApplicationStatus,
  type EmployerApplicationRow,
} from "@/lib/api/applications-employer-api";
import {
  applicationStatusLabel,
  formatApplicantDate,
  isRejectedApplicationStatus,
  isShortlistedApplicationStatus,
} from "@/lib/employer-applications-ui";
import { listEmployerJobs, type EmployerJob } from "@/lib/api/jobs-employer-api";

type ApplicantTab = "all" | "shortlisted" | "rejected";

// Shared Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const isShortlisted = isShortlistedApplicationStatus(status);
  const isRejected = isRejectedApplicationStatus(status);
  
  const styles = isShortlisted 
    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
    : isRejected 
    ? "bg-rose-50 text-rose-700 border-rose-100" 
    : "bg-blue-50 text-blue-700 border-blue-100";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${styles}`}>
      {applicationStatusLabel(status)}
    </span>
  );
};

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const { user, accessToken, ready } = useAuth();

  const [job, setJob] = useState<EmployerJob | null>(null);
  const [applications, setApplications] = useState<EmployerApplicationRow[]>([]);
  const [tab, setTab] = useState<ApplicantTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [resumeOpeningId, setResumeOpeningId] = useState<string | null>(null);
  const [resumeDownloadingId, setResumeDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !jobId) return;
    setLoading(true);
    try {
      const jobs = await listEmployerJobs(accessToken);
      const found = jobs.find((j) => j.id === jobId) ?? null;
      setJob(found);
      if (found) {
        const apps = await listApplicationsForJob(accessToken, jobId);
        setApplications(apps);
      }
    } catch (e: any) {
      setError(e?.message || "Could not load applicants.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, jobId]);

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "company") {
      router.replace("/dashboard/employee/my-jobs");
      return;
    }
    void load();
  }, [ready, user, router, load]);

  const counts = useMemo(() => ({
    all: applications.length,
    shortlisted: applications.filter(a => isShortlistedApplicationStatus(a.status)).length,
    rejected: applications.filter(a => isRejectedApplicationStatus(a.status)).length,
  }), [applications]);

  const filtered = useMemo(() => {
    if (tab === "shortlisted") return applications.filter(a => isShortlistedApplicationStatus(a.status));
    if (tab === "rejected") return applications.filter(a => isRejectedApplicationStatus(a.status));
    return applications;
  }, [applications, tab]);

  // Resume Handlers
  async function openResume(id: string, url?: string | null) {
    if (!accessToken) return;
    if (!url && url !== undefined) return setError("No resume uploaded.");
    if (url?.startsWith("http")) return window.open(url, "_blank");
    
    setResumeOpeningId(id);
    try {
      const blob = await fetchEmployerApplicationNurseResumePdf(accessToken, id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (e) { setError("Failed to open resume."); }
    finally { setResumeOpeningId(null); }
  }

  async function downloadResume(id: string, name: string | null | undefined) {
    if (!accessToken) return;
    setResumeDownloadingId(id);
    try {
      const blob = await fetchEmployerApplicationNurseResumePdf(accessToken, id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name?.replace(/\s+/g, "-") || "Resume"}.pdf`;
      a.click();
    } catch (e) { setError("Download failed."); }
    finally { setResumeDownloadingId(null); }
  }

  async function updateStatus(id: string, status: "reviewed" | "rejected") {
    if (!accessToken) return;
    setActionId(id);
    try {
      await updateEmployerApplicationStatus(accessToken, id, status);
      await load();
    } catch (e) { setError("Action failed."); }
    finally { setActionId(null); }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Finding Candidates</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-8 md:px-8 lg:px-12">
      {/* Back Button & Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/employee/my-jobs"
          className="group inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-red-600"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition-all group-hover:ring-red-200 group-hover:bg-red-50">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Back to My Jobs
        </Link>
        
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              {job?.title || "Job Applicants"}
            </h1>
            <p className="mt-2 text-gray-500 break-all">
              Manage candidates for <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{job?.slug}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Candidates", count: counts.all },
          { id: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
          { id: "rejected", label: "Rejected", count: counts.rejected }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as ApplicantTab)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === t.id 
                ? "bg-red-600 text-white shadow-lg shadow-red-200" 
                : "bg-white text-gray-500 border border-gray-100 hover:border-red-200"
            }`}
          >
            {t.label}
            <span className={`rounded-lg px-2 py-0.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-gray-100"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Applicants List */}
      <div className="grid gap-4">
        {filtered.map((a) => (
          <div key={a.id} className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 transition-all hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              
              {/* Candidate Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {a.nurse?.fullName || "Anonymous Candidate"}
                    </h3>
                    <StatusBadge status={a.status} />
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 break-all">
                      <Mail className="h-4 w-4 text-gray-300" />
                      {a.nurse?.email || "No email"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-300" />
                      Applied {formatApplicantDate(a.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-6 lg:border-0 lg:pt-0">
                {isShortlistedApplicationStatus(a.status) ? (
                  <Link
                    href={`/dashboard/employee/messages?applicationId=${a.id}`}
                    className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-black"
                  >
                    <MessageCircle className="h-4 w-4" /> Message
                  </Link>
                ) : (
                  <button
                    disabled={actionId === a.id || isRejectedApplicationStatus(a.status)}
                    onClick={() => updateStatus(a.id, "reviewed")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Shortlist
                  </button>
                )}

                <button
                  disabled={actionId === a.id || isRejectedApplicationStatus(a.status)}
                  onClick={() => updateStatus(a.id, "rejected")}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>

            {/* Details & Resume Section */}
            <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-gray-50/50 p-4">
              {a.coverLetter && (
                <div className="text-sm">
                  <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" /> Cover Letter
                  </p>
                  <p className="text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-default transition-all">
                    {a.coverLetter}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openResume(a.id, a.nurse?.resumeUrl)}
                  disabled={resumeOpeningId === a.id}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" />
                  {resumeOpeningId === a.id ? "Opening..." : "View Resume"}
                </button>
                <div className="h-4 w-px bg-gray-200" />
                <button
                  onClick={() => downloadResume(a.id, a.nurse?.fullName)}
                  disabled={resumeDownloadingId === a.id}
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {resumeDownloadingId === a.id ? "Downloading..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-100 py-24 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-6">
              <User className="h-12 w-12 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No candidates found</h3>
            <p className="mt-2 text-sm text-gray-400">Try switching tabs or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}