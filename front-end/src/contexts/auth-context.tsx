"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  type AuthUser,
  loginRequest,
  registerRequest,
  type RegisterRole,
} from "@/lib/api/auth-api";
import { syncSessionCookie } from "@/lib/auth/sync-session-cookie";

const STORAGE_TOKEN = "ann_access_token";
const STORAGE_USER = "ann_user";

// Define a type for the response that includes both user and token
type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  ready: boolean;
  // Updated return types to Promise<AuthResponse>
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (input: {
    email: string;
    password: string;
    role: RegisterRole;
  }) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (
    patch: Partial<
      Pick<
        AuthUser,
        | "profilePhotoUrl"
        | "profileBannerUrl"
        | "fullName"
        | "communityBannedAt"
      >
    >,
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const raw = localStorage.getItem(STORAGE_USER);
    if (!token || !raw) return { token: null, user: null };
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.id || !user?.email) {
      return { token: null, user: null };
    }
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function persistAuth(token: string, user: AuthUser): void {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { token, user: u } = readStoredAuth();
    setAccessToken(token);
    setUser(u);
    setReady(true);
    if (token) void syncSessionCookie(token);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setAccessToken(null);
    setUser(null);
    void syncSessionCookie(null);
    queryClient.clear();
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest({ email, password });
    persistAuth(res.accessToken, res.user);
    setAccessToken(res.accessToken);
    setUser(res.user);
    void syncSessionCookie(res.accessToken);
    return res; // Returns { user, accessToken }
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; role: RegisterRole }) => {
      const res = await registerRequest(input);
      persistAuth(res.accessToken, res.user);
      setAccessToken(res.accessToken);
      setUser(res.user);
      void syncSessionCookie(res.accessToken);
      return res; // Returns { user, accessToken }
    },
    [],
  );

  const updateUser = useCallback(
    (
      patch: Partial<
        Pick<
          AuthUser,
          | "profilePhotoUrl"
          | "profileBannerUrl"
          | "fullName"
          | "communityBannedAt"
        >
      >,
    ) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next: AuthUser = { ...prev };
        if ("profilePhotoUrl" in patch) {
          const v = patch.profilePhotoUrl;
          const cleared =
            v === null ||
            v === undefined ||
            (typeof v === "string" && v.trim() === "");
          if (cleared) {
            delete next.profilePhotoUrl;
          } else if (typeof v === "string") {
            next.profilePhotoUrl = v.trim();
          }
        }
        if ("profileBannerUrl" in patch) {
          const v = patch.profileBannerUrl;
          const cleared =
            v === null ||
            v === undefined ||
            (typeof v === "string" && v.trim() === "");
          if (cleared) {
            delete next.profileBannerUrl;
          } else if (typeof v === "string") {
            next.profileBannerUrl = v.trim();
          }
        }
        if ("fullName" in patch) {
          const v = patch.fullName;
          if (v === null || v === undefined) {
            next.fullName = null;
          } else if (typeof v === "string") {
            const t = v.trim();
            next.fullName = t.length ? t : null;
          }
        }
        if ("communityBannedAt" in patch && next.role === "nurse") {
          const v = patch.communityBannedAt;
          if (v === null || v === undefined || v === "") {
            next.communityBannedAt = null;
          } else if (typeof v === "string") {
            next.communityBannedAt = v.trim() || null;
          }
        }
        if (
          (next.profilePhotoUrl ?? null) === (prev.profilePhotoUrl ?? null) &&
          (next.profileBannerUrl ?? null) === (prev.profileBannerUrl ?? null) &&
          (next.fullName ?? null) === (prev.fullName ?? null) &&
          (next.communityBannedAt ?? null) === (prev.communityBannedAt ?? null)
        ) {
          return prev;
        }
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_TOKEN)
            : null;
        if (token) persistAuth(token, next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      ready,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, accessToken, ready, login, register, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}