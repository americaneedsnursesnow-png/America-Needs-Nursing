"use client";

import { useId, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { RegisterRole } from "@/lib/api/auth-api";
import { patchAccountMe } from "@/lib/api/account-api";
import { createCompany } from "@/lib/api/company-api";
import { patchMyNurseProfile, uploadMyNurseResumePdf } from "@/lib/api/nurse-profile-api";

type CompleteProfileModalProps = {
  onClose: () => void;
  initialEmail?: string;
  initialPassword?: string;
  initialRole?: string;
};

export function CompleteProfileModal({ 
  onClose, 
  initialEmail = "", 
  initialPassword = "", 
  initialRole = "" 
}: CompleteProfileModalProps) {
  const titleId = useId();
  const { register, updateUser } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Initialize all states with empty strings to prevent .trim() errors ---
  const [fullName, setFullName] = useState("");
  const [spec, setSpec] = useState("");
  const [license, setLicense] = useState("");
  const [years, setYears] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const isNurse = initialRole === "nurse";
  const isEmployer = initialRole === "company";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Defensive check for registration credentials
    if (!initialEmail || !initialPassword) {
      setError("Registration credentials missing. Please restart from step 1.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. REGISTER THE USER FIRST
      // This creates the user record and logs them in
      if (initialRole !== "nurse" && initialRole !== "company") {
        setError("Please choose a valid account type and try again.");
        return;
      }
      const authResponse = await register({
        email: initialEmail.trim(),
        password: initialPassword,
        role: initialRole as RegisterRole,
      });

      // Extract the token from the response
      const token = authResponse.accessToken;

      // 2. UPDATE FULL NAME
      const me = await patchAccountMe(token, {
        fullName: fullName.trim(),
      });
      updateUser({ fullName: me.fullName });

      // 3. ROLE-SPECIFIC DATA
      if (isNurse) {
        const n = parseInt(years, 10);
        await patchMyNurseProfile(token, {
          specialization: spec.trim(),
          licenseNumber: license.trim(),
          yearsExperience: n,
        });
        if (resumeFile) {
          await uploadMyNurseResumePdf(token, resumeFile);
        }
      } else if (isEmployer) {
        await createCompany(token, {
          name: companyName.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        });
      }

      // Success! Clear temp data and finish
      sessionStorage.removeItem("pending_reg_data");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:max-w-xl md:p-8">
        <h2 id={titleId} className="text-2xl font-extrabold text-gray-900 md:text-3xl">
          Complete your profile
        </h2>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Full name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black outline-none focus:ring-2 focus:ring-[var(--color-button)]"
              disabled={submitting}
            />
          </div>

          {isNurse && (
            <>
               <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Specialization *</label>
                <input
                  type="text"
                  required
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  placeholder="e.g. ICU"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">License # *</label>
                    <input
                      type="text"
                      required
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">Experience (Years) *</label>
                    <input
                      type="number"
                      required
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black"
                    />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Resume (PDF) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
            </>
          )}

          {isEmployer && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl py-4 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-button)" }}
          >
            {submitting ? "REGISTERING..." : "COMPLETE REGISTRATION"}
          </button>
        </form>
      </div>
    </div>
  );
}