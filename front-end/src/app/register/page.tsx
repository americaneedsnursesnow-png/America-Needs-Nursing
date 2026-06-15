"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthApiError } from "@/lib/api/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { useRegistration } from "@/contexts/registration-context";

// --- Modern Error Icon (Matches Sign-in) ---
function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// --- Other Icons (Kept exactly as they were) ---
function EyeIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function EyeOffIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L3.59 3.59m13.12 13.12L20.41 20.41" /></svg>; }
function GoogleIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>; }
function BriefcaseIcon({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>; }
function UserPlusIcon({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>; }

const MIN_PASSWORD = 8;

export default function SignUpPage() {
  const { ready } = useAuth();
  const { setData } = useRegistration();
  const router = useRouter();
  const [roleUi, setRoleUi] = useState<"seeker" | "poster">("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- NEW INLINE ERROR STATES ---
  const [error, setError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Front-end Validations
    if (!email.trim()) { 
      setError("Please enter your email address."); 
      setShakeTrigger(p => p + 1); 
      return; 
    }
    if (password.length < MIN_PASSWORD) { 
      setError(`Password must be at least ${MIN_PASSWORD} characters.`); 
      setShakeTrigger(p => p + 1); 
      return; 
    }
    if (password !== confirmPassword) { 
      setError("Passwords do not match. Please check again."); 
      setShakeTrigger(p => p + 1); 
      return; 
    }

    setSubmitting(true);
    try {
      const role = roleUi === "seeker" ? "nurse" : "company";
      // Store credentials in React context (in-memory only — never persisted to storage)
      setData({ email: email.trim(), password, role });
      router.push("/register-details");
    } catch (err: any) {
      const status = err.status || err.statusCode || err.response?.status;
      const rawMessage = err.message || "";
      const lowerMessage = rawMessage.toLowerCase();

      let userFriendlyMessage = "Registration failed. Please try again.";

      if (status === 409 || lowerMessage.includes("already exists")) {
        userFriendlyMessage = "This email is already registered. Please sign in.";
      } else if (lowerMessage.includes("fetch failed") || lowerMessage.includes("network")) {
        userFriendlyMessage = "We're having trouble connecting to our server. Please check your internet connection.";
      } else if (status === 500) {
        userFriendlyMessage = "Our system is experiencing a temporary hiccup. Our engineers are on it!";
      }

      setError(userFriendlyMessage);
      setShakeTrigger(prev => prev + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-3xl">
        <div className="p-6 sm:p-10">
          <div className="mb-2 text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/ANN.png" alt="Logo" className="mx-auto h-14 w-auto" />
          </Link>
        </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* INLINE ERROR BANNER (Matches Sign-in Form) */}
            {error && (
              <div 
                key={shakeTrigger} 
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm animate-shake transition-all mb-4"
                role="alert"
              >
                <div className="shrink-0 mt-0.5">
                  <ErrorIcon />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900">Sign-up Issue</h4>
                  <p className="text-xs text-red-700 mt-0.5 font-medium leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="register-email" className="input-label font-semibold">Email Address</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="form-input"
                disabled={!ready || submitting}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3">
              <div>
                <label htmlFor="register-password" title="Password" className="input-label !tracking-normal font-semibold">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    disabled={!ready || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="register-confirm" className="input-label font-semibold">Confirm</label>
                <div className="relative">
                  <input
                    id="register-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    disabled={!ready || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-gray-400 pl-2">At least {MIN_PASSWORD} characters required.</p>

            <div className="pt-2">
              <label className="mb-2 block text-xs font-bold pl-2 tracking-wider text-gray-700 uppercase">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleUi("seeker")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                    roleUi === "seeker" ? "border-[var(--color-button)] bg-[var(--color-button)]/5 text-[var(--color-button)]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <BriefcaseIcon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Nurse</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleUi("poster")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                    roleUi === "poster" ? "border-[var(--color-button)] bg-[var(--color-button)]/5 text-[var(--color-button)]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <UserPlusIcon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">COMPANY</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!ready || submitting}
              className="group relative w-full overflow-hidden rounded-xl py-3.5 text-xs font-bold tracking-[0.1em] text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: "var(--color-button)" }}
            >
              <span className="relative z-10">{submitting ? "PROCESSING..." : "CREATE ACCOUNT"}</span>
              <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform group-hover:translate-x-0" />
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100" />
              <span className="mx-3 text-[10px] font-bold text-gray-300">OR</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            <button type="button" className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50">
              <GoogleIcon /> SIGN UP WITH GOOGLE
            </button>

            <p className="mt-6 text-center text-xs text-gray-500">
              Already have an account? <Link href="/sign-in" className="font-bold text-[var(--color-button)] hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}