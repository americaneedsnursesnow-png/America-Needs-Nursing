"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Default package URL → profile sub-route. */
export default function PackageIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/employee/package/profile");
  }, [router]);
  return null;
}
