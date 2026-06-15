"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// APIs and Context
import { useAuth } from "@/contexts/auth-context";
import { useRegistration } from "@/contexts/registration-context";
import { patchAccountMe } from "@/lib/api/account-api";
import {
  createCompany,
  uploadCompanyHero,
  uploadCompanyLogo,
} from "@/lib/api/company-api";
import { patchMyNurseProfile } from "@/lib/api/nurse-profile-api";
import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor.lazy";
import { isRichTextEffectivelyEmpty, sanitizeJobRichHtml } from "@/lib/sanitize-job-html";

// --- Modern Error Icon (Matches Sign-in/Sign-up) ---
function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function RegisterDetailsPage() {
  const router = useRouter();
  const { register, updateUser } = useAuth();
  // Credentials live in React context only — never persisted to any browser storage
  const { data: tempData, clear: clearRegData } = useRegistration();

  // --- Logic States ---
  const [submitting, setSubmitting] = useState(false);

  // --- Inline Error States ---
  const [error, setError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // --- Form States ---
  const [fullName, setFullName] = useState("");
  const [spec, setSpec] = useState("");
  const [license, setLicense] = useState("");
  const [years, setYears] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyCulture, setCompanyCulture] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyHeroFile, setCompanyHeroFile] = useState<File | null>(null);

  const companyLogoPreview = useMemo(
    () => (companyLogoFile ? URL.createObjectURL(companyLogoFile) : null),
    [companyLogoFile],
  );
  const companyHeroPreview = useMemo(
    () => (companyHeroFile ? URL.createObjectURL(companyHeroFile) : null),
    [companyHeroFile],
  );

  // If no in-memory registration data exists, the user landed here directly
  // (e.g. typed the URL or hard-refreshed the page). Send them back to start.
  useEffect(() => {
    if (!tempData) {
      router.push("/register");
    }
  }, [tempData, router]);

  useEffect(() => {
    return () => {
      if (companyLogoPreview) URL.revokeObjectURL(companyLogoPreview);
      if (companyHeroPreview) URL.revokeObjectURL(companyHeroPreview);
    };
  }, [companyLogoPreview, companyHeroPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 1. Validate in-memory registration data before starting
    if (!tempData) {
      setError("Session data missing. Please restart registration.");
      setShakeTrigger((p) => p + 1);
      return;
    }

    setSubmitting(true);

    try {
      // Safely extract values with fallbacks to avoid .trim() errors
      const emailVal = (tempData.email || "").toString().trim();
      const passwordVal = (tempData.password || "").toString();
      const roleVal = (tempData.role || "nurse").toString();
      const fullNameVal = (fullName || "").trim();

      if (!emailVal) {
        throw new Error("Email is missing from registration data.");
      }

      // 2. CALL REGISTER
      let authResponse;
      try {
        authResponse = await register({
          email: emailVal,
          password: passwordVal,
          role: roleVal,
        });
      } catch (err: any) {
        // Check for 409 status in the error object (Standard for Axios/Fetch wrappers)
        const status = err.status || err.response?.status;

        if (status === 409 || err.message?.includes("409")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(err.message || "Registration failed. Please try again.");
        }
        setShakeTrigger((p) => p + 1);
        setSubmitting(false);
        return; // IMPORTANT: Stop execution here so we don't try to use a non-existent token
      }

      const token = authResponse?.accessToken;
      if (!token) {
        throw new Error("Registration succeeded but no session token was received.");
      }

      // 3. ROLE SPECIFIC LOGIC
      if (roleVal === "nurse") {
        await patchAccountMe(token, { fullName: fullNameVal });
        updateUser({ fullName: fullNameVal });

        await patchMyNurseProfile(token, {
          specialization: (spec || "").trim(),
          licenseNumber: (license || "").trim(),
          yearsExperience: parseInt(years || "0", 10),
        });

        clearRegData(); // Clear credentials from memory
        router.push("/");
      } else {
        if (!(companyName || "").trim()) {
          throw new Error("Company name is required.");
        }
        if (!(companyEmail || "").trim()) {
          throw new Error("Business email is required.");
        }
        if (!(companyPhone || "").trim()) {
          throw new Error("Business phone number is required.");
        }

        await createCompany(token, {
          name: (companyName || "").trim(),
          slug: (slug || "").trim().toLowerCase().replace(/\s+/g, "-"),
          contactEmail: (companyEmail || "").trim() || undefined,
          contactPhone: (companyPhone || "").trim() || undefined,
          description: isRichTextEffectivelyEmpty(companyDescription)
            ? undefined
            : sanitizeJobRichHtml(companyDescription),
          cultureText: isRichTextEffectivelyEmpty(companyCulture)
            ? undefined
            : sanitizeJobRichHtml(companyCulture),
        });

        if (companyLogoFile) {
          await uploadCompanyLogo(token, companyLogoFile);
        }
        if (companyHeroFile) {
          await uploadCompanyHero(token, companyHeroFile);
        }

        clearRegData(); // Clear credentials from memory
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Setup Error:", err);
      setError(err.message || "An unexpected error occurred during setup.");
      setShakeTrigger((p) => p + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinishLater() {
    setError(null);
    if (!tempData) {
      setError("Session data missing. Please restart registration.");
      setShakeTrigger((p) => p + 1);
      return;
    }

    setSubmitting(true);
    try {
      const emailVal = (tempData.email || "").toString().trim();
      const passwordVal = (tempData.password || "").toString();
      const roleVal = (tempData.role || "nurse").toString();
      const fullNameVal = (fullName || "").trim();

      if (!emailVal) {
        throw new Error("Email is missing from registration data.");
      }

      const authResponse = await register({
        email: emailVal,
        password: passwordVal,
        role: roleVal,
      });

      const token = authResponse?.accessToken;
      if (!token) {
        throw new Error("Registration succeeded but no session token was received.");
      }

      if (fullNameVal) {
        await patchAccountMe(token, { fullName: fullNameVal });
        updateUser({ fullName: fullNameVal });
      }

      clearRegData(); // Clear credentials from memory
      router.push("/dashboard");
    } catch (err: any) {
      const status = err.status || err.response?.status;
      if (status === 409 || err.message?.includes("409")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err.message || "Could not complete registration right now.");
      }
      setShakeTrigger((p) => p + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const role = tempData?.role || "nurse";
  const isNurse = role === "nurse";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
        <div className="text-center">
            <img src="/logo/ANN.png" alt="Logo" className="mx-auto mb-4 h-10 w-auto object-contain sm:h-12" />
        </div>
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-gray-900">Complete Profile</h2>
          <p className="text-xs text-gray-500 mt-1">
            Setting up your <span className="font-bold text-button uppercase">{role}</span> account
          </p>
        </div>

        {/* INLINE ERROR BANNER (Matches Sign-in/Sign-up) */}
        {error && (
          <div 
            key={shakeTrigger} 
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm animate-shake transition-all mb-6"
            role="alert"
          >
            <div className="shrink-0 mt-0.5"><ErrorIcon /></div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900">Setup Issue</h4>
              <p className="text-xs text-red-700 mt-0.5 font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isNurse ? (
            <>
              <div>
                <label className="input-label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  placeholder="Enter your full name"
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="input-label">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  value={spec} 
                  placeholder="e.g. Registered Nurse"
                  onChange={(e) => setSpec(e.target.value)} 
                  className="form-input" 
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">License #</label>
                  <input required value={license} placeholder="ABC12345" onChange={(e) => setLicense(e.target.value)} className="form-input" disabled={submitting} />
                </div>
                <div>
                  <label className="input-label">Years Exp</label>
                  <input required type="number" value={years} onChange={(e) => setYears(e.target.value)} className="form-input" disabled={submitting} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="input-label">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input required value={companyName} onChange={(e) => {
                  setCompanyName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }} className="form-input" disabled={submitting} />
              </div>
              <div>
                <label className="input-label">URL Slug</label>
                <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="form-input" disabled={submitting} />
              </div>
              <div>
                <label className="input-label">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="form-input"
                  placeholder="company@example.com"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="input-label">
                  Business Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="form-input"
                  placeholder="+1 555 123 4567"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="input-label">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCompanyLogoFile(e.target.files?.[0] || null)}
                  className="form-input py-2"
                  disabled={submitting}
                />
                {companyLogoPreview && (
                  <img
                    src={companyLogoPreview}
                    alt="Company logo preview"
                    className="h-20 w-20 rounded-xl border border-gray-200 object-contain bg-white p-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="input-label">Company Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCompanyHeroFile(e.target.files?.[0] || null)}
                  className="form-input py-2"
                  disabled={submitting}
                />
                {companyHeroPreview && (
                  <img
                    src={companyHeroPreview}
                    alt="Company banner preview"
                    className="h-24 w-full rounded-xl border border-gray-200 object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="input-label">Company Description</label>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <RichTextEditor value={companyDescription} onChange={setCompanyDescription} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="input-label">Culture & Values</label>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <RichTextEditor value={companyCulture} onChange={setCompanyCulture} />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full overflow-hidden rounded-xl bg-button py-4 text-xs font-bold text-white shadow-lg shadow-button/20 transition-all hover:bg-button-dark active:scale-[0.98] disabled:opacity-50"
          >
            <span className="relative z-10">{submitting ? "PROCESSING PROFILE..." : "FINISH REGISTRATION"}</span>
          </button>

          {isNurse && (
            <button
              type="button"
              onClick={handleFinishLater}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              FINISH IT LATER
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
