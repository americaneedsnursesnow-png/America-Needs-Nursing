"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { CommunityHubUnreadProvider } from "@/contexts/community-hub-unread-context";
import { PostRegisterProfileGate } from "@/features/onboarding";
import { QueryProvider } from "@/components/providers/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CommunityHubUnreadProvider>
          <PostRegisterProfileGate>{children}</PostRegisterProfileGate>
        </CommunityHubUnreadProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
