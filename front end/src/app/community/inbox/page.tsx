import { redirect } from "next/navigation";

/** Nurse inbox lives in the community messaging hub (same URL folder UX). */
export default function CommunityInboxRedirectPage() {
  redirect("/community/messages?tab=inbox");
}
