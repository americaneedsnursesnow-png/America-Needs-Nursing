"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AuthApiError,
  getPostAuthRedirectPath,
  sanitizePostAuthRedirect,
} from "@/lib/api/auth-api";
import { useAuth } from "@/contexts/auth-context";

// Modern Error Icon
function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// Visibility Icons
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

type SignInFormProps = {
  onSuccess?: () => void;
  compact?: boolean;
  redirectTo?: string | null;
};

export function SignInForm({ onSuccess, compact, redirectTo }: SignInFormProps) {
  const { login, ready } = useAuth();
  const router = useRouter();
  
  // -- STATE DEFINITIONS --
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <--- TOGGLE STATE
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      setShakeTrigger(prev => prev + 1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      onSuccess?.();
      const next = redirectTo?.trim() || null;
      const path = next
        ? sanitizePostAuthRedirect(res.user.role, next, {
            communityBannedAt: res.user.communityBannedAt,
          })
        : getPostAuthRedirectPath(res.user.role, {
            communityBannedAt: res.user.communityBannedAt,
          });
      router.push(path);
    } catch (err: any) {
      const status = err.status || err.statusCode || err.response?.status;
      const rawMessage = err.message || "";
      const lowerMessage = rawMessage.toLowerCase();

      let userFriendlyMessage = "Sign in failed. Please try again.";

      if (status === 503 || lowerMessage.includes("invalid credentials") || lowerMessage.includes("unauthorized")) {
        userFriendlyMessage = "The email or password you entered is incorrect. Please try again.";
      } 
      else if (
        lowerMessage.includes("fetch failed") || 
        lowerMessage.includes("networkerror") || 
        lowerMessage.includes("failed to fetch")
      ) {
        userFriendlyMessage = "We're having trouble connecting to our server. Please check your internet connection.";
      } 
      else if (status == 500) {
        userFriendlyMessage = "Our system is experiencing a temporary hiccup. Our engineers are on it!";
      }

      setError(userFriendlyMessage);
      setShakeTrigger(prev => prev + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div 
          key={shakeTrigger} 
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm animate-shake transition-all"
          role="alert"
        >
          <div className="shrink-0 mt-0.5">
            <ErrorIcon />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-900">Sign-in Issue</h4>
            <p className="text-xs text-red-700 mt-0.5 font-medium leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="ml-1 block text-sm font-semibold text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="form-input"
          disabled={!ready || submitting}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="block text-sm font-semibold text-gray-700">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-button hover:text-button-dark transition-colors">
            Forgot?
          </Link>
        </div>
        
        {/* PASSWORD INPUT CONTAINER */}
        <div className="relative group">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input pr-11" // Added padding for the icon
            disabled={!ready || submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!ready || submitting}
        className="group relative w-full overflow-hidden rounded-xl bg-button py-4 font-bold text-white shadow-lg shadow-button/20 transition-all hover:bg-button-dark active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {submitting ? (
            <>
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            "LOG IN TO ACCOUNT"
          )}
        </div>
      </button>

      
    </form>
  );
}