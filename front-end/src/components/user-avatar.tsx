"use client";

import { useMemo, useState } from "react";

export type UserAvatarProps = {
  email: string;
  /** When set, initials are derived from this name instead of the email. */
  displayName?: string | null;
  /** Absolute or same-origin URL; when missing or load fails, initials are shown. */
  photoUrl?: string | null;
  size?: number;
  className?: string;
};

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() ?? "?";
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || "?";
  const parts = local.split(/[.\-_+]+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export function UserAvatar({
  email,
  displayName,
  photoUrl,
  size = 36,
  className = "",
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const trimmed = photoUrl?.trim();
  const showImage = Boolean(trimmed && !imgFailed);

  const initials = useMemo(() => {
    const n = displayName?.trim();
    if (n) return initialsFromDisplayName(n);
    return initialsFromEmail(email);
  }, [displayName, email]);

  const dim = { width: size, height: size };

  if (showImage && trimmed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote user uploads; arbitrary origins
      <img
        src={trimmed}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
        style={dim}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-button/15 text-[0.65rem] font-bold uppercase leading-none text-button ring-2 ring-white ${className}`}
      style={dim}
      role="img"
      aria-label={
        displayName?.trim()
          ? `Avatar for ${displayName.trim()}`
          : `Avatar for ${email}`
      }
    >
      {initials}
    </span>
  );
}
