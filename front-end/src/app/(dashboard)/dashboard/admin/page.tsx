import { redirect } from "next/navigation";

/** Former admin hub; staff land on the shared dashboard instead. */
export default function AdminDashboardHomeRedirect() {
  redirect("/dashboard");
}
