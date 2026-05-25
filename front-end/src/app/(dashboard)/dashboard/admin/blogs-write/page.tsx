"use client";

import React, { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  CalendarClock,
  Plus,
  Search,
  Edit3,
  ChevronLeft,
  Send,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  MoreVertical,
  Trash2,
} from "lucide-react";

import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor.lazy";
import { useAuth } from "@/contexts/auth-context";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import {
  createBlogPost,
  deleteBlogPost,
  listAdminBlogPosts,
  updateBlogPost,
  uploadBlogPostImage,
  type AdminBlogPost,
  type BlogPostStatus,
} from "@/lib/api/blog-admin-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import { canAccessBlogNewsletterAdmin } from "@/lib/api/auth-api";
import {
  isRichTextEffectivelyEmpty,
  sanitizeBlogRichHtml,
} from "@/lib/sanitize-job-html";

type EditorForm = {
  id: string | null;
  title: string;
  slug: string;
  body: string;
  coverImageUrl: string;
  excerpt: string;
  status: BlogPostStatus;
  scheduledAt: string;
  sponsored: boolean;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultScheduleLocalValue(): string {
  return toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

const emptyForm = (): EditorForm => ({
  id: null,
  title: "",
  slug: "",
  body: "",
  coverImageUrl: "",
  excerpt: "",
  status: "draft",
  scheduledAt: defaultScheduleLocalValue(),
  sponsored: false,
});

function formatListDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminBlogSystem() {
  const { accessToken, ready, user } = useAuth();
  const [view, setView] = useState<"list" | "edit">("list");
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<EditorForm>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pick<AdminBlogPost, 'id' | 'title'> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** Remount rich editor when starting a fresh post (no id). */
  const [newBodyEditorKey, setNewBodyEditorKey] = useState(0);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const activeMenuRef = useRef<HTMLDivElement>(null);
  const activeMenuButtonRef = useRef<HTMLButtonElement>(null);

  const closeActionMenu = useCallback(() => {
    setActionMenuOpenId(null);
    setActionMenuPosition(null);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        activeMenuRef.current?.contains(target) ||
        activeMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      closeActionMenu();
    }
    if (actionMenuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionMenuOpenId, closeActionMenu]);

  const adjustHeight = (ref: RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  const loadPosts = useCallback(async () => {
    if (!accessToken) return;
    setListLoading(true);
    setListError(null);
    try {
      const list = await listAdminBlogPosts(accessToken);
      setPosts(list);
    } catch (e) {
      setListError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load posts.",
      );
    } finally {
      setListLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!ready || !accessToken || !user || !canAccessBlogNewsletterAdmin(user.role))
      return;
    void loadPosts();
  }, [ready, accessToken, user, loadPosts]);

  useEffect(() => {
    if (view === "edit") {
      adjustHeight(titleRef);
    }
  }, [view, formData.title]);

  const handleCreateNew = () => {
    setNewBodyEditorKey((k) => k + 1);
    setFormData(emptyForm());
    setSaveError(null);
    setView("edit");
  };

  const handleEdit = (post: AdminBlogPost) => {
    setFormData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      body: post.body,
      coverImageUrl: post.coverImageUrl ?? "",
      excerpt: post.excerpt ?? "",
      status: post.status,
      scheduledAt: post.scheduledAt
        ? toDatetimeLocalValue(new Date(post.scheduledAt))
        : defaultScheduleLocalValue(),
      sponsored: post.sponsored,
    });
    setSaveError(null);
    setView("edit");
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaveError(null);
    if (!formData.title.trim() || isRichTextEffectivelyEmpty(formData.body)) {
      setSaveError("Title and body are required.");
      return;
    }
    let scheduledAtIso: string | undefined;
    if (formData.status === "scheduled") {
      const scheduledAt = new Date(formData.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        setSaveError("Choose a valid publish date and time.");
        return;
      }
      if (scheduledAt.getTime() <= Date.now()) {
        setSaveError("Scheduled publish time must be in the future.");
        return;
      }
      scheduledAtIso = scheduledAt.toISOString();
    }
    const bodyHtml = sanitizeBlogRichHtml(formData.body.trim());
    setSaving(true);
    try {
      if (formData.id) {
        await updateBlogPost(accessToken, formData.id, {
          title: formData.title.trim(),
          body: bodyHtml,
          coverImageUrl: formData.coverImageUrl.trim() || null,
          excerpt: formData.excerpt.trim() || null,
          sponsored: formData.sponsored,
          status: formData.status,
          scheduledAt: scheduledAtIso ?? null,
        });
      } else {
        const createBody = {
          title: formData.title.trim(),
          body: bodyHtml,
          excerpt: formData.excerpt.trim() || undefined,
          sponsored: formData.sponsored,
          status: formData.status,
          ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
          ...(formData.coverImageUrl.trim()
            ? { coverImageUrl: formData.coverImageUrl.trim() }
            : {}),
        };
        await createBlogPost(accessToken, createBody);
      }
      await loadPosts();
      setView("list");
      setFormData(emptyForm());
    } catch (e) {
      setSaveError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Save failed.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActionMenu = (
    postId: string,
    button: HTMLButtonElement,
  ) => {
    setActionMenuOpenId((current) => {
      if (current === postId) {
        setActionMenuPosition(null);
        return null;
      }

      const menuWidth = 176;
      const menuHeight = 96;
      const edgeGap = 16;
      const rect = button.getBoundingClientRect();
      const shouldOpenUp =
        window.innerHeight - rect.bottom < menuHeight + edgeGap &&
        rect.top >= menuHeight + edgeGap;
      setActionMenuPosition({
        top: shouldOpenUp
          ? rect.top - menuHeight - 8
          : Math.min(
              rect.bottom + 8,
              window.innerHeight - menuHeight - edgeGap,
            ),
        left: Math.max(
          edgeGap,
          Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - edgeGap),
        ),
      });
      return postId;
    });
  };

  const handleDeletePrompt = (post: Pick<AdminBlogPost, 'id' | 'title'>) => {
    setDeleteError(null);
    closeActionMenu();
    setDeleteTarget(post);
  };

  const handleCancelDelete = () => {
    setDeleteError(null);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteBlogPost(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      await loadPosts();
    } catch (e) {
      setDeleteError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Delete failed.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleBodyImageUpload = useCallback(
    async (file: File) => {
      if (!accessToken) {
        throw new Error("Not signed in");
      }
      const { url } = await uploadBlogPostImage(accessToken, file);
      return url.startsWith("/") ? url : `/${url}`;
    },
    [accessToken],
  );

  async function handleCoverFile(file: File | null) {
    if (!file || !accessToken) return;
    setSaveError(null);
    setCoverUploading(true);
    try {
      const { url } = await uploadBlogPostImage(accessToken, file);
      setFormData((f) => ({ ...f, coverImageUrl: url }));
    } catch (e) {
      setSaveError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Image upload failed.",
      );
    } finally {
      setCoverUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  }

  const filtered = posts.filter((p) =>
    `${p.title} ${p.slug}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="box-border min-h-screen w-full bg-[#FDFDFD] font-sans text-slate-900">
      {view === "list" ? (
        <div className="box-border w-full animate-in px-4 py-8 fade-in duration-700 sm:px-6 sm:py-12">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
             <h1 className="text-2x lsm:text-3xl lg:text-4xl font-black tracking-tight ">
              Content Studio
            </h1>
              <p className="mt-2 text-lg text-slate-500">
                Create and publish posts. Cover photos upload to the server (JPEG,
                PNG, or WebP, up to 5 MB).
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-3 rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition-all hover:bg-red-700 active:scale-95"
            >
              <Plus size={22} /> New post
            </button>
          </div>

          {listError ? (
            <p
              className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
              role="alert"
            >
              {listError}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-50 p-8">
              <div className="relative max-w-md">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="search"
                  placeholder="Filter by title or slug…"
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 outline-none transition-all focus:ring-2 focus:ring-red-600/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto min-h-[260px]">
              {listLoading ? (
                <div className="flex justify-center py-16 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      <th className="w-16 px-4 py-5 pl-10">Cover</th>
                      <th className="px-10 py-5">Article</th>
                      <th className="px-10 py-5">Slug</th>
                      <th className="px-10 py-5">Status</th>
                      <th className="px-10 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((post) => (
                      <tr
                        key={post.id}
                        className="group transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-8 pl-10 align-middle">
                          {blogCoverSrc(post.coverImageUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={blogCoverSrc(post.coverImageUrl) ?? ""}
                              alt=""
                              className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-8">
                          <span className="block text-lg font-bold text-slate-800 transition-colors group-hover:text-red-600">
                            {post.title}
                          </span>
                          <span className="mt-1 block text-sm font-medium text-slate-400">
                            {formatListDate(post.updatedAt)}
                          </span>
                        </td>
                        <td className="px-10 py-8 font-mono text-sm text-slate-600">
                          {post.slug}
                        </td>
                        <td className="px-10 py-8">
                          <span
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                              post.status === "published"
                                ? "bg-emerald-50 text-emerald-700"
                                : post.status === "scheduled"
                                  ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {post.status}
                          </span>
                          {post.status === "scheduled" && post.scheduledAt ? (
                            <span className="mt-2 block text-xs font-semibold text-slate-400">
                              {formatListDate(post.scheduledAt)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div
                            className="relative inline-flex"
                          >
                            <button
                              ref={actionMenuOpenId === post.id ? activeMenuButtonRef : undefined}
                              type="button"
                              onClick={(e) =>
                                handleToggleActionMenu(post.id, e.currentTarget)
                              }
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                              aria-expanded={actionMenuOpenId === post.id}
                              aria-haspopup="menu"
                            >
                              Actions
                              <MoreVertical size={18} />
                            </button>
                            {actionMenuOpenId === post.id && actionMenuPosition
                              ? createPortal(
                                  <div
                                    ref={activeMenuRef}
                                    className="fixed z-[200] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
                                    style={{
                                      top: actionMenuPosition.top,
                                      left: actionMenuPosition.left,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleEdit(post);
                                        closeActionMenu();
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                                    >
                                      <Edit3 size={16} className="text-slate-400" />
                                      Edit blog
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePrompt(post)}
                                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 active:bg-red-100/50"
                                    >
                                      <Trash2 size={16} className="text-red-500" />
                                      Delete blog
                                    </button>
                                  </div>,
                                  document.body,
                                )
                              : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {!listLoading && filtered.length === 0 && !listError ? (
              <p className="py-12 text-center text-slate-500">No posts yet.</p>
            ) : null}
          </div>
          {deleteTarget ? (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Trash2 size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black tracking-tight text-slate-900">
                      Delete blog post
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteTarget.title}</span>? This action is permanent and cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close delete confirmation"
                  >
                    <X size={18} />
                  </button>
                </div>
                {deleteError ? (
                  <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/10 transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur-xl">
            <div className="box-border flex w-full items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setView("list");
                    setSaveError(null);
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  {formData.id ? "Edit post" : "New post"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {formData.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget(
                        formData.id
                          ? { id: formData.id, title: formData.title }
                          : null,
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>

          <main className="box-border w-full px-4 py-8 sm:px-6 sm:py-12">
            {saveError ? (
              <p
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}
            <div className="flex flex-col gap-12 lg:flex-row">
              <div className="flex-1 space-y-10">
                <div className="space-y-4">
                  <label
                    htmlFor="article-title"
                    className="block text-sm font-bold uppercase tracking-wider text-slate-500"
                  >
                    Title
                  </label>
                  <textarea
                    id="article-title"
                    ref={titleRef}
                    placeholder="Post title…"
                    className="w-full resize-none overflow-hidden bg-transparent text-3xl font-black leading-[1.1] text-slate-800 outline-none placeholder:text-gray-200 md:text-4xl"
                    rows={1}
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      adjustHeight(titleRef);
                    }}
                  />
                  {!formData.id ? (
                    <p className="text-xs text-slate-400">
                      A unique post URL is generated automatically when you save (you can
                      reuse the same title anytime).
                    </p>
                  ) : null}
                </div>

                {formData.id ? (
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Public URL
                    </span>
                    <code className="break-all text-sm text-slate-700">
                      /blog/{formData.slug}
                    </code>
                    <p className="text-xs text-slate-400">
                      The slug is fixed after publish so existing links keep working.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Body
                  </label>
                  <p className="text-xs text-slate-400">
                    Formatting toolbar: bold, lists, headings, quotes, images
                    (JPEG/PNG/WebP, 5 MB), undo/redo. Inline images upload to the
                    server and appear in the public post.
                  </p>
                  <RichTextEditor
                    key={formData.id ?? `new-${newBodyEditorKey}`}
                    value={formData.body}
                    onChange={(html) =>
                      setFormData((f) => ({ ...f, body: html }))
                    }
                    placeholder="Write the article…"
                    aria-label="Blog post body"
                    contentMinClass="min-h-[28rem] md:min-h-[32rem]"
                    disabled={!accessToken}
                    bodyImageUpload={
                      accessToken ? handleBodyImageUpload : undefined
                    }
                  />
                </div>
              </div>

              <div className="w-full lg:w-[380px]">
                <div className="sticky top-32 space-y-8 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                  <h2 className="border-b border-slate-50 pb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    Publishing
                  </h2>

                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Cover image
                    </span>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      {blogCoverSrc(formData.coverImageUrl) ? (
                        <div className="relative aspect-video w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={blogCoverSrc(formData.coverImageUrl) ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((f) => ({ ...f, coverImageUrl: "" }))
                            }
                            className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                            aria-label="Remove cover image"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-2 text-slate-400">
                          <ImageIcon size={32} />
                          <span className="text-xs font-medium">No cover yet</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) =>
                        void handleCoverFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <button
                      type="button"
                      disabled={coverUploading || !accessToken}
                      onClick={() => coverFileRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {coverUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {coverUploading ? "Uploading…" : "Upload photo"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="post-status"
                      className="text-[11px] font-black uppercase tracking-wider text-slate-400"
                    >
                      Status
                    </label>
                    <select
                      id="post-status"
                      className="w-full cursor-pointer rounded-xl border border-transparent bg-slate-50 px-5 py-3 font-bold outline-none transition-all focus:border-red-100"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as BlogPostStatus,
                          scheduledAt:
                            e.target.value === "scheduled" &&
                            !formData.scheduledAt
                              ? defaultScheduleLocalValue()
                              : formData.scheduledAt,
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {formData.status === "scheduled" ? (
                    <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                      <label
                        htmlFor="post-scheduled-at"
                        className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-800"
                      >
                        <CalendarClock size={14} aria-hidden />
                        Publish date and time
                      </label>
                      <input
                        id="post-scheduled-at"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        min={toDatetimeLocalValue(new Date())}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduledAt: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-amber-200"
                      />
                      <p className="text-xs font-medium leading-relaxed text-amber-900/80">
                        Time is interpreted in your browser&apos;s local timezone
                        and queued in UTC on the server.
                      </p>
                    </div>
                  ) : null}
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.sponsored}
                      onChange={(e) =>
                        setFormData({ ...formData, sponsored: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Sponsored
                    </span>
                  </label>
                  <div className="space-y-3">
                    <label
                      htmlFor="post-excerpt"
                      className="text-[11px] font-black uppercase tracking-wider text-slate-400"
                    >
                      Excerpt (optional)
                    </label>
                    <textarea
                      id="post-excerpt"
                      rows={4}
                      className="w-full rounded-xl border border-transparent bg-slate-50 px-5 py-3 text-sm outline-none focus:border-red-100"
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Short summary for listings…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
