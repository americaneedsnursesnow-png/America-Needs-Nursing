"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy URL: same shell as messages, opens the community (group) pane. */
export default function CommunityGroupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/community/messages");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-white text-gray-600">
      Opening community chat…
    </div>
  );
}
