"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/contexts/auth-context";
import {
  deleteNurseCommunity,
  getNurseCommunity,
  listNurseCommunityMembers,
  removeNurseCommunityMember,
  updateNurseCommunity,
  uploadNurseCommunityImage,
  type NurseCommunityDetail,
  type NurseCommunityMemberRow,
} from "@/lib/api/nurse-communities-api";
import { BackendRequestError } from "@/lib/api/authed-client";

export default function NurseCommunitySettingsPage() {
  const params = useParams();
  const communityId = String(params?.communityId ?? "");
  const router = useRouter();
  const { user, accessToken, ready } = useAuth();
  const [c, setC] = useState<NurseCommunityDetail | null>(null);
  const [members, setMembers] = useState<NurseCommunityMemberRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken || !communityId) return;
    setErr(null);
    setPageLoading(true);
    try {
      const d = await getNurseCommunity(accessToken, communityId);
      setC(d);
      setName(d.name);
      setDescription(d.description);
      setRules(d.rules);
      const m = await listNurseCommunityMembers(accessToken, communityId);
      setMembers(m);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setPageLoading(false);
    }
  }, [accessToken, communityId]);

  useEffect(() => {
    if (!ready || !user) {
      if (ready) {
        router.replace(
          "/sign-in?next=" + encodeURIComponent(`/community/messages/${communityId}/settings`),
        );
      }
      return;
    }
    if (user.role !== "nurse" && user.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }
    void load();
  }, [ready, user, router, load, communityId]);

  useEffect(() => {
    if (!c || !user) return;
    if (c.isOwner || user.role === "super_admin") return;
    if (user.role === "nurse") {
      router.replace("/community/messages");
    }
  }, [c, user, router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setErr(null);
    try {
      const u = await updateNurseCommunity(accessToken, communityId, {
        name: name.trim(),
        description: description.trim(),
        rules: rules.trim(),
      });
      setC((prev) =>
        prev
          ? {
              ...prev,
              ...u,
              updatedAt: prev.updatedAt,
            }
          : null,
      );
    } catch (e) {
      if (e instanceof BackendRequestError) {
        setErr(e.message);
      } else {
        setErr("Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onImage(file: File) {
    if (!accessToken) return;
    try {
      const { imageUrl } = await uploadNurseCommunityImage(
        accessToken,
        communityId,
        file,
      );
      setC((prev) => (prev ? { ...prev, imageUrl } : null));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function onRemoveMember(uid: string) {
    if (!accessToken) return;
    if (!window.confirm("Remove this member?")) return;
    try {
      await removeNurseCommunityMember(accessToken, communityId, uid);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function onDeleteCommunity() {
    if (!accessToken) return;
    if (!window.confirm("Delete this community permanently? This cannot be undone.")) {
      return;
    }
    try {
      await deleteNurseCommunity(accessToken, communityId);
      router.replace("/community/messages");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!ready || !user) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (err && !c) {
    return (
      <div className="p-8 text-center text-red-600">
        {err}{" "}
        <Link href="/community/messages" className="underline">
          Back
        </Link>
      </div>
    );
  }

  if (pageLoading || !c) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  const isOwner = c.isOwner || user?.role === "super_admin";
  const canDeleteCommunity =
    (c.isOwner && user?.role === "nurse") || user?.role === "super_admin";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/community/messages"
        className="text-sm font-bold text-red-600"
      >
        ← Back to communities
      </Link>
      <h1 className="mt-4 text-2xl font-black">Community settings</h1>
      {c.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.imageUrl}
          alt=""
          className="mt-4 h-40 w-40 object-cover rounded-2xl border"
        />
      )}
      {isOwner && (
        <div className="mt-4">
          <label className="block text-xs font-black uppercase text-neutral-400 mb-1">
            Community image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void onImage(f);
              }
            }}
          />
        </div>
      )}

      <form onSubmit={onSave} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
        />
        <textarea
          className="w-full rounded-xl border p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isOwner}
        />
        <textarea
          className="w-full rounded-xl border p-2"
          rows={4}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          disabled={!isOwner}
        />
        {isOwner && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-red-600 px-4 py-2 text-white font-bold"
          >
            {saving ? "…" : "Save"}
          </button>
        )}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      <h2 className="mt-10 text-lg font-black">Members</h2>
      <ul className="mt-2 space-y-2">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center justify-between rounded-xl border px-3 py-2"
          >
            <div>
              <p className="text-sm font-bold">{m.email}</p>
              {m.fullName && (
                <p className="text-xs text-neutral-500">{m.fullName}</p>
              )}
            </div>
            {isOwner && m.userId !== c.creatorUserId && (
              <button
                type="button"
                onClick={() => onRemoveMember(m.userId)}
                className="text-xs text-red-600 font-bold"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {canDeleteCommunity && (
        <button
          type="button"
          onClick={() => void onDeleteCommunity()}
          className="mt-10 rounded-xl border-2 border-red-200 text-red-700 px-4 py-3 text-sm font-black w-full"
        >
          Delete community
        </button>
      )}
    </div>
  );
}
