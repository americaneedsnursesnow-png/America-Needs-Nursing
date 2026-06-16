"use client";

import { ChunkLoadRecovery } from "@/components/chunk-load-recovery";
import { AuthProvider } from "@/contexts/auth-context";
import { RegistrationProvider } from "@/contexts/registration-context";
import { CommunityHubUnreadProvider } from "@/contexts/community-hub-unread-context";
import { PostRegisterProfileGate } from "@/features/onboarding";
import { QueryProvider } from "@/components/providers/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ChunkLoadRecovery />
      <AuthProvider>
        <RegistrationProvider>
          <CommunityHubUnreadProvider>
            <PostRegisterProfileGate>{children}</PostRegisterProfileGate>
          </CommunityHubUnreadProvider>
        </RegistrationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
