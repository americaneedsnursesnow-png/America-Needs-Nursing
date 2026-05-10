"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "@/contexts/auth-context";
import { canProvisionAdminAccounts, type AuthUserRole } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import { provisionAdminUser } from "@/lib/api/users-admin-api";

const MIN_PASSWORD = 8;

const ROLE_OPTIONS: { value: "content_admin" | "super_admin"; label: string }[] = [
  { value: "content_admin", label: "Content admin (blog + newsletter only)" },
  { value: "super_admin", label: "Super admin (full access)" },
];

/**
 * Super admins create other super admins and content-only admins.
 * (Route name is legacy; role `staff_admin` is removed.)
 */
export default function CreateAdminAccountsPage() {
  const { ready, user, accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"content_admin" | "super_admin">("content_admin");
  const [saving, setSaving] = useState(false);

  if (!ready || !user || !canProvisionAdminAccounts(user.role)) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-4 text-center text-slate-600">
        <ShieldCheck className="h-12 w-12 text-slate-400" aria-hidden />
        <p className="text-sm font-medium">You do not have access to this page.</p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) {
      void Swal.fire("Session", "Please sign in again.", "warning");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      void Swal.fire("Password", `Use at least ${MIN_PASSWORD} characters.`, "warning");
      return;
    }
    if (password !== confirm) {
      void Swal.fire("Password", "Passwords do not match.", "warning");
      return;
    }

    setSaving(true);
    try {
      await provisionAdminUser(accessToken, {
        email,
        password,
        role: role as AuthUserRole,
      });
      void Swal.fire({
        icon: "success",
        title: "Account created",
        text: `User ${email.trim()} was created as ${role.replace("_", " ")}.`,
      });
      setEmail("");
      setPassword("");
      setConfirm("");
      setRole("content_admin");
    } catch (err) {
      const msg =
        err instanceof BackendRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Request failed.";
      void Swal.fire({ icon: "error", title: "Could not create user", text: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-4xl px-8 py-10 sm:px-12 lg:px-12">
      <div className="mb-8 flex items-start gap-4 px-10">
        <div className="rounded-2xl bg-red-600 p-3 text-white shadow-lg shadow-red-200">
          <UserPlus className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create content or super admin
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            New accounts are created for this site only. Content admins can manage the blog
            and newsletter; super admins have full access.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label
            htmlFor="prov-role"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Role
          </label>
          <select
            id="prov-role"
            value={role}
            onChange={(ev) => setRole(ev.target.value as "content_admin" | "super_admin")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            disabled={saving}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="prov-email"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="prov-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prov-pass"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="prov-pass"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                disabled={saving}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="prov-confirm"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="prov-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
          Create account
        </button>
      </form>
    </div>
  );
}
