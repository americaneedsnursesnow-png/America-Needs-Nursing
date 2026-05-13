import { spacingFetch } from "./api-request-spacing";
import { getApiBaseUrl, getAuthClientName } from "./env";

export { getAuthClientName };

export type AuthUserRole =
  | "nurse"
  | "company"
  | "admin"
  | "content_admin"
  | "super_admin";

export type NurseCommunityOpts = {
  communityBannedAt?: string | null;
};

/** Nurse hub + discussions / group chat (not employers or staff `admin`). */
export function canAccessCommunity(
  role: AuthUserRole,
  opts?: NurseCommunityOpts,
): boolean {
  if (role !== "nurse" && role !== "super_admin") return false;
  if (role === "nurse" && opts?.communityBannedAt) return false;
  return true;
}

/**
 * Super admins use community inside the dashboard shell (same as Blog / Tiers).
 * Nurses use `/community/messages` (messaging hub: Community + Inbox tabs; `/community/group` redirects).
 * Banned nurses are sent to profile instead.
 */
export function getCommunityHubPath(
  role: AuthUserRole,
  opts?: NurseCommunityOpts,
): string {
  if (role === "nurse" && opts?.communityBannedAt) {
    return "/profile/update";
  }
  if (role === "super_admin") return "/dashboard/admin/community";
  return "/community/messages";
}

/** Staff roles that use the dashboard admin profile route. */
export function isStaffAdminAccount(role: AuthUserRole): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    role === "content_admin"
  );
}

/** Job packages, approvals, directory, community moderation, imports. */
export function isFullOpsAdmin(role: AuthUserRole): boolean {
  return role === "super_admin" || role === "admin";
}

/** Blog + newsletter broadcast (matches Nest `blog` + `newsletter/admin/broadcast`). */
export function canAccessBlogNewsletterAdmin(role: AuthUserRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "content_admin"
  );
}

/** `/dashboard/admin/*` shell: operations admin, content-only CMS, or super admin. */
export function canAccessAdminShell(role: AuthUserRole): boolean {
  return isFullOpsAdmin(role) || role === "content_admin";
}

/**
 * Whether `path` may be used as a post-auth redirect for this role.
 * Ops admins may open any `/dashboard/admin/*` screen; limited roles only their slice.
 */
export function isAllowedAdminPathForRole(
  role: AuthUserRole,
  path: string,
): boolean {
  if (!path.startsWith("/dashboard/admin")) return false;
  if (path.startsWith("//")) return false;
  if (isFullOpsAdmin(role) || role === "super_admin") return true;
  if (role === "content_admin") {
    return (
      path === "/dashboard/admin" ||
      path.startsWith("/dashboard/admin/blogs-write") ||
      path.startsWith("/dashboard/admin/newsletter") ||
      path.startsWith("/dashboard/admin/profile")
    );
  }
  return false;
}

/** Default landing inside `/dashboard/admin` for shell roles (hub). */
export function getAdminDashboardHomePath(): string {
  return "/dashboard/admin";
}

/** `POST /users` — super admin may create `content_admin` and `super_admin` only. */
export function canProvisionAdminAccounts(role: AuthUserRole): boolean {
  return role === "super_admin";
}

export function getProfileUpdatePath(role: AuthUserRole): string {
  if (isStaffAdminAccount(role)) return "/dashboard/admin/profile";
  if (role === "company") return "/dashboard/employee/profile";
  return "/profile/update";
}

/** Employer-facing onboarding / company flows (staff admin included). */
export function isEmployerLikeRole(role: AuthUserRole): boolean {
  return role === "company" || role === "admin";
}

/** Roles that may use `/dashboard` (sidebar app). Nurses never may. */
export function canAccessDashboard(role: AuthUserRole): boolean {
  return (
    role === "company" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "content_admin"
  );
}

/**
 * Default route after sign-in/register when no safe `next` query is provided.
 * Nurses → community hub (never dashboard). Staff/employers → dashboard.
 */
export function getPostAuthRedirectPath(
  role: AuthUserRole,
  opts?: NurseCommunityOpts,
): string {
  if (role === "nurse") return getCommunityHubPath("nurse", opts);
  if (role === "content_admin") {
    return getAdminDashboardHomePath();
  }
  return "/dashboard";
}

/**
 * After login, never send nurses to dashboard; never send staff/employers outside dashboard
 * when they requested an internal return URL.
 */
export function sanitizePostAuthRedirect(
  role: AuthUserRole,
  requested: string | null,
  opts?: NurseCommunityOpts,
): string {
  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) {
    return getPostAuthRedirectPath(role, opts);
  }
  if (role === "nurse") {
    if (requested === "/dashboard" || requested.startsWith("/dashboard/")) {
      return getPostAuthRedirectPath("nurse", opts);
    }
    if (
      opts?.communityBannedAt &&
      (requested === "/community" ||
        requested.startsWith("/community/") ||
        requested.startsWith("/dashboard/admin/community"))
    ) {
      return "/profile/update";
    }
    return requested;
  }
  if (role === "content_admin") {
    if (isAllowedAdminPathForRole(role, requested)) {
      return requested;
    }
    return getAdminDashboardHomePath();
  }
  if (canAccessDashboard(role)) {
    if (requested === "/dashboard" || requested.startsWith("/dashboard/")) {
      return requested;
    }
    return "/dashboard";
  }
  return getPostAuthRedirectPath(role, opts);
}

/** Shaped for Nest `User` JSON; photo fields are optional until the API adds them. */
export type AuthUser = {
  id: string;
  clientName: string;
  email: string;
  role: AuthUserRole;
  createdAt: string;
  fullName?: string | null;
  profilePhotoUrl?: string | null;
  profileBannerUrl?: string | null;
  /** ISO timestamp when an admin removed this nurse from the community hub. */
  communityBannedAt?: string | null;
};

/** Raw user payload from auth endpoints (may include alternate photo keys). */
export type AuthUserPayload = AuthUser & { avatarUrl?: string | null };

function coerceAuthUserRole(value: unknown): AuthUserRole {
  if (
    value === "nurse" ||
    value === "company" ||
    value === "employer" ||
    value === "admin" ||
    value === "content_admin" ||
    value === "super_admin"
  ) {
    if (value === "employer") return "company";
    return value as AuthUserRole;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "nurse") return "nurse";
    if (v === "company" || v === "employer") return "company";
    if (v === "admin") return "admin";
    if (v === "content_admin" || v === "contentadmin") return "content_admin";
    if (v === "staff_admin" || v === "staffadmin")
      return "admin";
    if (v === "super_admin" || v === "superadmin") return "super_admin";
  }
  // Missing/unknown role: do not assume company (would unlock dashboard by mistake)
  return "nurse";
}

export function normalizeAuthUser(payload: AuthUserPayload): AuthUser {
  const raw = payload.profilePhotoUrl ?? payload.avatarUrl;
  const trimmed =
    raw === null || raw === undefined
      ? ""
      : typeof raw === "string"
        ? raw.trim()
        : "";
  const photo = trimmed.length > 0 ? trimmed : null;
  const fullNameProp =
    payload.fullName !== undefined
      ? {
          fullName:
            payload.fullName === null
              ? null
              : String(payload.fullName).trim() || null,
        }
      : {};
  const role = coerceAuthUserRole(payload.role);
  const rawBan = (payload as { communityBannedAt?: unknown })
    .communityBannedAt;
  const communityBannedAt =
    role === "nurse"
      ? rawBan === null ||
          rawBan === undefined ||
          (typeof rawBan === "string" && rawBan.trim() === "")
        ? null
        : typeof rawBan === "string"
          ? rawBan.trim()
          : null
      : undefined;
  const bannerRaw = (payload as { profileBannerUrl?: unknown }).profileBannerUrl;
  const profileBannerUrl =
    bannerRaw === undefined
      ? undefined
      : bannerRaw === null ||
          (typeof bannerRaw === "string" && bannerRaw.trim() === "")
        ? null
        : typeof bannerRaw === "string"
          ? bannerRaw.trim()
          : null;

  return {
    id: payload.id,
    clientName: payload.clientName,
    email: payload.email,
    role,
    createdAt: payload.createdAt,
    ...fullNameProp,
    ...(photo ? { profilePhotoUrl: photo } : {}),
    ...(profileBannerUrl !== undefined ? { profileBannerUrl } : {}),
    ...(role === "nurse" ? { communityBannedAt } : {}),
  };
}

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterRole = "nurse" | "company";

function normalizeMessage(message: string | string[] | undefined): string {
  if (!message) return "Request failed";
  return Array.isArray(message) ? message.join(". ") : message;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.body = body;
  }
}

type NestErrorBody = {
  statusCode?: number;
  message?: string | string[];
};

async function parseAuthResponse(res: Response): Promise<AuthResponse> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const obj = (data ?? {}) as NestErrorBody;
    const msg = normalizeMessage(obj.message) || res.statusText;
    throw new AuthApiError(res.status, msg, data);
  }

  const parsed = data as { accessToken: string; user: AuthUserPayload };
  return {
    accessToken: parsed.accessToken,
    user: normalizeAuthUser(parsed.user),
  };
}

export async function loginRequest(input: {
  email: string;
  password: string;
  clientName?: string;
}): Promise<AuthResponse> {
  const clientName = input.clientName ?? getAuthClientName();
  const res = await spacingFetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName,
      email: input.email.trim(),
      password: input.password,
    }),
  });
  return parseAuthResponse(res);
}

export async function registerRequest(input: {
  email: string;
  password: string;
  role: RegisterRole;
  clientName?: string;
}): Promise<AuthResponse> {
  const clientName = input.clientName ?? getAuthClientName();
  const res = await spacingFetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName,
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
    }),
  });
  return parseAuthResponse(res);
}

async function parseMessageResponse(res: Response): Promise<void> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const obj = (data ?? {}) as NestErrorBody;
    const msg = normalizeMessage(obj.message) || res.statusText;
    throw new AuthApiError(res.status, msg, data);
  }
}

/** Request a password-reset code by email (OTP). Treat 2xx as success for UX. */
export async function forgotPasswordRequest(input: {
  email: string;
  clientName?: string;
}): Promise<{ otpExpiresInSeconds: number }> {
  const clientName = input.clientName ?? getAuthClientName();
  const res = await spacingFetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName,
      email: input.email.trim().toLowerCase(),
    }),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const obj = (data ?? {}) as NestErrorBody;
    const msg = normalizeMessage(obj.message) || res.statusText;
    throw new AuthApiError(res.status, msg, data);
  }
  const obj = (data ?? {}) as { otpExpiresInSeconds?: number };
  const otpExpiresInSeconds =
    typeof obj.otpExpiresInSeconds === "number" && Number.isFinite(obj.otpExpiresInSeconds)
      ? obj.otpExpiresInSeconds
      : 600;
  return { otpExpiresInSeconds };
}

/** After user enters the email OTP; returns a short-lived token for `/reset-password?token=`. */
export async function verifyPasswordResetOtp(input: {
  email: string;
  code: string;
  clientName?: string;
}): Promise<{ resetToken: string; resetTokenExpiresInSeconds: number }> {
  const clientName = input.clientName ?? getAuthClientName();
  const res = await spacingFetch(`${getApiBaseUrl()}/auth/otp/verify`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName,
      email: input.email.trim().toLowerCase(),
      code: input.code.trim(),
    }),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const obj = (data ?? {}) as NestErrorBody;
    const msg = normalizeMessage(obj.message) || res.statusText;
    throw new AuthApiError(res.status, msg, data);
  }
  const obj = (data ?? {}) as {
    resetToken?: string;
    resetTokenExpiresInSeconds?: number;
  };
  if (!obj.resetToken || typeof obj.resetToken !== "string") {
    throw new AuthApiError(502, "Invalid response from server.", data);
  }
  const resetTokenExpiresInSeconds =
    typeof obj.resetTokenExpiresInSeconds === "number" &&
    Number.isFinite(obj.resetTokenExpiresInSeconds)
      ? obj.resetTokenExpiresInSeconds
      : 600;
  return { resetToken: obj.resetToken, resetTokenExpiresInSeconds };
}

export async function resetPasswordRequest(input: {
  token: string;
  password: string;
  clientName?: string;
}): Promise<void> {
  const clientName = input.clientName ?? getAuthClientName();
  const res = await spacingFetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName,
      token: input.token.trim(),
      password: input.password,
    }),
  });
  await parseMessageResponse(res);
}
