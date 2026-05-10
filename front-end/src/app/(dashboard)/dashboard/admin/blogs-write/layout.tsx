import { RequireBlogNewsletterAdmin } from "@/components/layout/dashboard/require-blog-newsletter-admin";

export default function BlogWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireBlogNewsletterAdmin>{children}</RequireBlogNewsletterAdmin>;
}
