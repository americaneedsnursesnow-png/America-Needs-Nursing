"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth-context";
import { fetchEmployerBootstrap } from "@/lib/api/employer-bootstrap-api";
import { queryKeys } from "@/lib/query-keys";

const STALE_MS = 2 * 60_000;

/**
 * Shared employer dashboard payload (deduped across banner, modals, package page, submit-job).
 */
export function useEmployerDashboardBootstrap() {
  const { accessToken, user, ready } = useAuth();
  const enabled =
    ready && Boolean(accessToken) && user?.role === "employer";

  return useQuery({
    queryKey: queryKeys.employerBootstrap(user?.id),
    queryFn: () => fetchEmployerBootstrap(accessToken!),
    enabled,
    staleTime: STALE_MS,
    gcTime: 15 * 60_000,
  });
}
