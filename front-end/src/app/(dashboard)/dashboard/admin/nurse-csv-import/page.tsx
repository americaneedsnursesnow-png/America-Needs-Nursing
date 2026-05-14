"use client";

import React, { useCallback, useId, useState } from "react";
import { CheckCircle2, FileUp, Loader2, ShieldAlert } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  importNursesFromCsv,
  type NurseCsvImportResult,
} from "@/lib/api/nurse-import-api";

export default function NurseCsvImportPage() {
  const { accessToken, ready, user } = useAuth();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NurseCsvImportResult | null>(null);

  const runImport = useCallback(async () => {
    if (!accessToken || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await importNursesFromCsv(accessToken, file);
      setResult(r);
    } catch (e) {
      setError(
        e instanceof BackendRequestError
          ? e.message
          : "Import failed. Try again or use a .csv / .txt file with email addresses.",
      );
    } finally {
      setBusy(false);
    }
  }, [accessToken, file]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full min-w-3xl px-6 py-10">
      {/* Header - Icon removed as requested */}
      <div className="mb-10 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:4xl lg:5xl font-black tracking-tight text-slate-900">
          Import Nurse Accounts
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Upload a CSV containing email addresses to batch-create nurse accounts.
        </p>
      </div>

      {/* Info Notice - Flat Design */}
      <div
        className="mb-8 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center"
        role="status"
      >
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
        <p>
          <strong>Security:</strong> Existing accounts are skipped automatically. 
          Nurses will be assigned a default password to change upon first login.
        </p>
      </div>

      {/* Upload Section - No Shadow, Clean Borders */}
      <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 sm:p-8">
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-bold text-slate-800"
        >
          Select CSV File
        </label>
        <p className="mb-6 text-sm text-slate-500">
          Max 5,000 unique emails (5MB limit).
        </p>
        
        <div className="space-y-6">
          <div className="relative">
            <input
              id={inputId}
              type="file"
              accept=".csv,.txt,text/csv"
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-slate-100 file:text-slate-700
                hover:file:bg-slate-200 cursor-pointer"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                setError(null);
              }}
            />
            {file && (
              <p className="mt-3 text-xs font-medium text-emerald-600">
                Ready to import: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!file || busy}
            onClick={() => void runImport()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileUp className="h-5 w-5" />
            )}
            {busy ? "Processing..." : "Import & Create Accounts"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Success Results */}
      {result && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4 flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <span className="text-lg font-bold">Import Completed</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Default Password</p>
              <code className="mt-1 block text-lg font-mono font-bold text-red-600">
                {result.defaultPassword}
              </code>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Processed</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{result.totalEmailsFound}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">New Accounts Created:</span>
              <span className="font-bold text-emerald-600">{result.created}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Skipped (Existing):</span>
              <span className="font-bold text-slate-800">{result.skipped}</span>
            </div>
            {result.failed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Failed:</span>
                <span className="font-bold text-red-600">{result.failed}</span>
              </div>
            )}
          </div>

          {result.results.length > 0 && (
            <details className="mt-6 group">
              <summary className="flex cursor-pointer items-center text-sm font-bold text-slate-500 hover:text-slate-800">
                View detailed logs
              </summary>
              <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ul className="space-y-2 font-mono text-[11px] text-slate-600">
                  {result.results.slice(0, 500).map((r, idx) => (
                    <li key={idx} className="border-b border-slate-200 pb-1 last:border-0">
                      <span className="font-bold">{r.status.toUpperCase()}</span>: {r.email} 
                      {r.message && <span className="text-slate-400"> — {r.message}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}