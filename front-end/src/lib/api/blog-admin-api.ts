import { authedJson, authedMultipartJson, authedVoid } from "./authed-client";

/** Matches Nest `BlogPostStatus`. */
export type BlogPostStatus = "draft" | "published";

/** Admin list/create/update response (Nest `BlogPost` entity, camelCase). */
export type AdminBlogPost = {
  id: string;
  clientName: string;
  title: string;
  slug: string;
  body: string;
  coverImageUrl?: string | null;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sponsored: boolean;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBlogPostBody = {
  title: string;
  /** Omit to let the API generate a unique slug from the title. */
  slug?: string;
  body: string;
  coverImageUrl?: string | null;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  sponsored?: boolean;
  status: BlogPostStatus;
  /** ISO date string when scheduling / overriding publish time */
  publishedAt?: string;
};

export type UpdateBlogPostBody = {
  title?: string;
  body?: string;
  coverImageUrl?: string | null;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sponsored?: boolean;
  status?: BlogPostStatus;
  publishedAt?: string | null;
};

/** Multipart field name must be `file` (Nest `FileInterceptor('file')`). Max 5 MB on server. */
export async function uploadBlogPostImage(
  accessToken: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<{ url: string }>(
    "/blog/posts/images",
    accessToken,
    form,
  );
}

export async function listAdminBlogPosts(
  accessToken: string,
): Promise<AdminBlogPost[]> {
  return authedJson<AdminBlogPost[]>("/blog/posts", accessToken, {
    method: "GET",
  });
}

export async function createBlogPost(
  accessToken: string,
  body: CreateBlogPostBody,
): Promise<AdminBlogPost> {
  return authedJson<AdminBlogPost>("/blog/posts", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateBlogPost(
  accessToken: string,
  postId: string,
  body: UpdateBlogPostBody,
): Promise<AdminBlogPost> {
  return authedJson<AdminBlogPost>(`/blog/posts/${postId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteBlogPost(
  accessToken: string,
  postId: string,
): Promise<void> {
  return authedVoid(`/blog/posts/${postId}`, accessToken, {
    method: "DELETE",
  });
}
