import { notFound, redirect } from "next/navigation";

import { usStateBySlug } from "@/lib/us-states";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobsInStateRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const row = usStateBySlug(slug);
  if (!row) notFound();
  redirect(`/jobs?state=${encodeURIComponent(row.code)}`);
}
