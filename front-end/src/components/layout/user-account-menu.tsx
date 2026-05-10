"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { useCommunityHubUnread } from "@/contexts/community-hub-unread-context";

type UserAccountMenuProps = {
  email: string;
  displayName?: string | null;
  profilePhotoUrl?: string | null;
  avatarSize: number;
  /** Link to `/dashboard`. Off for nurses (marketing shell only). */
  showDashboardLink?: boolean;
  /** Nurses and super admins only (not employers or staff `admin`). */
  showCommunityLink?: boolean;
  /** Nurses, employers, staff admin — job / applicant threads. */
  showMessagesLink?: boolean;
  messagesHref?: string;
  /** Menu label for the messages entry (e.g. “Inbox”). */
  messagesLabel?: string;
  /** Super admin: dashboard community URL; nurses: `/community/messages`. */
  communityHref?: string;
  /** Nurses: `/profile/update`; employers & staff use dashboard profile URLs. */
  profileHref?: string;
  onLogout: () => void;
  /** Desktop: align panel to end of trigger. Mobile: start. */
  align?: "end" | "start";
  /** Wider trigger on mobile drawer */
  className?: string;
};

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function UserAccountMenu({
  email,
  displayName,
  profilePhotoUrl,
  avatarSize,
  showDashboardLink = true,
  showCommunityLink = false,
  showMessagesLink = false,
  messagesHref = "/dashboard/employee/messages",
  messagesLabel = "Inbox",
  communityHref = "/community/messages",
  profileHref = "/profile/update",
  onLogout,
  align = "end",
  className = "",
}: UserAccountMenuProps) {
  const { communityUnread, messagesUnread } = useCommunityHubUnread();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent | PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-transparent py-1 pl-1 pr-1.5 transition-colors hover:border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-button/40"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Open account menu, signed in as ${email}`}
      >
        <UserAvatar
          email={email}
          displayName={displayName}
          photoUrl={profilePhotoUrl}
          size={avatarSize}
        />
        <ChevronDown open={menuOpen} />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute top-full z-[60] mt-2 min-w-[12rem] rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {showDashboardLink ? (
            <Link
              href="/dashboard"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : null}
          <Link
            href={profileHref}
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
            onClick={() => setMenuOpen(false)}
          >
            Change profile
          </Link>
          {showMessagesLink ? (
            <Link
              href={messagesHref}
              role="menuitem"
              className="relative flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              <span>{messagesLabel}</span>
              {messagesUnread ? (
                <span
                  className="size-2.5 shrink-0 rounded-full bg-red-600 ring-1 ring-red-200"
                  aria-hidden
                  title="Unread messages"
                />
              ) : null}
            </Link>
          ) : null}
          {showCommunityLink ? (
            <Link
              href={communityHref}
              role="menuitem"
              className="relative flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              <span>Community</span>
              {communityUnread ? (
                <span
                  className="size-2.5 shrink-0 rounded-full bg-red-600 ring-1 ring-red-200"
                  aria-hidden
                  title="Unread community chat"
                />
              ) : null}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
