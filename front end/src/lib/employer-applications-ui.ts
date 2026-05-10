/** Backend `ApplicationStatus` strings for employer job applications. */

export function formatApplicantDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function isShortlistedApplicationStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "reviewed" || s === "accepted";
}

export function isRejectedApplicationStatus(status: string): boolean {
  return status.toLowerCase() === "rejected";
}

export function applicationStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "reviewed" || s === "accepted") return "Shortlisted";
  if (s === "rejected") return "Rejected";
  if (s === "pending") return "Pending";
  return status;
}
