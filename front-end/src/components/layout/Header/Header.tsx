"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { BrandLogoImg } from "@/components/layout/BrandLogo";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { useAuth } from "@/contexts/auth-context";
import {
  canAccessCommunity,
  getCommunityHubPath,
  getProfileUpdatePath,
  type NurseCommunityOpts,
} from "@/lib/api/auth-api";
import { mainNav } from "@/config/navigation";

// --- Icons ---
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function NavChevron({ className }: { className?: string }) { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>; }
function SignInIcon({ className }: { className?: string }) { return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>; }
function UserPlusIcon({ className }: { className?: string }) { return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>; }
function MenuIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>; }

const SCROLL_THRESHOLD = 20;

export function Header() {
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const communityOpts: NurseCommunityOpts | undefined = user
    ? { communityBannedAt: user.communityBannedAt }
    : undefined;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCloseModal = () => {
    setShowSignIn(false);
    setErrorMessage(null);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b mr-2 transition-all  duration-200 ease-out ${
          scrolled
            ? "border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white"
        }`}
      >
<SiteContentWrapper className="flex h-16 items-center justify-between gap-14 md:gap-16 ">          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button/40 mr-2"
            onClick={() => setOpen(false)}
          >
            <BrandLogoImg imgClassName="h-10 sm:h-12" />
          </Link>

          {/* Desktop Navigation */}
<nav className="hidden flex-1 items-center justify-center gap-2 md:flex" aria-label="Primary">            {mainNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-red-50 text-red-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex flex-col items-center gap-1">
                    <span className={`h-0.5 w-6 rounded-full ${active ? "bg-red-600" : "bg-transparent"}`} aria-hidden />
                    <span className="leading-tight">{item.label}</span>
                  </span>
                  {item.dropdown && <NavChevron className="ml-0.5 opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Right Section (Desktop & Mobile Icons) */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* MOBILE ONLY LOGGED-IN ICONS (Always on top) */}
            {ready && user && (
              <div className="flex items-center gap-1 md:hidden">
                <NotificationBellLink />
                <UserAccountMenu
                  email={user.email}
                  displayName={user.fullName}
                  profilePhotoUrl={user.profilePhotoUrl}
                  avatarSize={32}
                  align="end"
                  showDashboardLink={user.role !== "nurse"}
                  showMessagesLink={user.role === "nurse" || user.role === "company" || user.role === "admin"}
                  messagesHref={user.role === "nurse" ? "/community/messages?tab=inbox" : "/dashboard/employee/messages"}
                  showCommunityLink={canAccessCommunity(user.role, communityOpts)}
                  communityHref={getCommunityHubPath(user.role, communityOpts)}
                  profileHref={getProfileUpdatePath(user.role)}
                  onLogout={() => logout()}
                />
              </div>
            )}

            {/* DESKTOP ONLY LOGGED-IN/LOGOUT SECTION */}
            <div className="hidden items-center gap-2 md:flex">
              {ready && user ? (
                <>
                  <NotificationBellLink />
                  <UserAccountMenu
                    email={user.email}
                    displayName={user.fullName}
                    profilePhotoUrl={user.profilePhotoUrl}
                    avatarSize={40}
                    align="end"
                    showDashboardLink={user.role !== "nurse"}
                    showMessagesLink={user.role === "nurse" || user.role === "company" || user.role === "admin"}
                    messagesHref={user.role === "nurse" ? "/community/messages?tab=inbox" : "/dashboard/employee/messages"}
                    showCommunityLink={canAccessCommunity(user.role, communityOpts)}
                    communityHref={getCommunityHubPath(user.role, communityOpts)}
                    profileHref={getProfileUpdatePath(user.role)}
                    onLogout={() => logout()}
                  />
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSignIn(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-red-700"
                  >
                    <SignInIcon className="opacity-90" /> Sign in
                  </button>
                  <Link href="/register" className="btn inline-flex items-center gap-2 !px-4 !py-2 text-sm">
                    <UserPlusIcon /> Register
                  </Link>
                </>
              )}
            </div>

            {/* HAMBURGER TOGGLE */}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-800 transition hover:bg-slate-100 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </SiteContentWrapper>

        {/* MOBILE DROPDOWN MENU */}
        {open ? (
          <div id="mobile-nav" className="border-t border-slate-100 bg-white shadow-card md:hidden">
            <nav aria-label="Mobile primary">
              <SiteContentWrapper className="flex flex-col gap-1 py-3">
                {mainNav.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-3 py-3 text-sm font-medium ${active ? "bg-red-50 text-red-700" : "text-slate-800 hover:bg-slate-50"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-2 border-t border-slate-100 pt-3">
                  {!user && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => { setOpen(false); setShowSignIn(true); }}
                        className="rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                      >
                        Sign in
                      </button>
                      <Link href="/register" className="btn w-full justify-center text-sm" onClick={() => setOpen(false)}>
                        Register
                      </Link>
                    </div>
                  )}
                  {/* Note: User profile links are now at the top bar for mobile, 
                      but we keep this block as per instructions not to remove anything important */}
                </div>
              </SiteContentWrapper>
            </nav>
          </div>
        ) : null}
      </header>

      {/* --- SIGN IN MODAL --- */}
      {showSignIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <CloseIcon />
            </button>
            <div className="p-8">
              <div className="mb-6 flex justify-center">
                <img src="/logo/ANN.png" alt="Logo" className="h-12 object-contain" />
              </div>
              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 animate-shake">
                  <div className="shrink-0 mt-0.5"><ErrorIcon /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-800">Login Issue</h3>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                  <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
                    <CloseIcon />
                  </button>
                </div>
              )}
              <SignInForm compact onSuccess={() => setShowSignIn(false)} />
              <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                <p className="text-sm text-gray-500">
                  New here?{" "}
                  <Link href="/register" className="font-bold text-button hover:underline" onClick={handleCloseModal}>
                    Create account
                  </Link>
                </p>
                <Link href="/sign-in" className="mt-2 block text-xs font-medium text-gray-400 hover:text-button transition-colors" onClick={handleCloseModal}>
                  Open full-screen sign-in
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}