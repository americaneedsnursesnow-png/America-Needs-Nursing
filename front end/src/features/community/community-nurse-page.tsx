"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Inbox, Plus, Settings, Users } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { canAccessCommunity } from "@/lib/api/auth-api";
import { getAccountMe } from "@/lib/api/account-api";
import { CommunityGroupChat } from "@/features/community/community-group-chat";
import {
  createNurseCommunity,
  joinNurseCommunity,
  listNurseCommunities,
  listNurseCommunityMembers,
  type NurseCommunityListItem,
} from "@/lib/api/nurse-communities-api";
import { fetchGlobalMentionRows } from "@/lib/api/community-group-chat-api";
import { BackendRequestError } from "@/lib/api/authed-client";

const COMMUNITY_MESSAGES_HREF = "/community/messages";

function communitySignInNextPath(pathname: string): string {
  if (
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname.startsWith("/dashboard/admin/community")
  ) {
    return pathname;
  }
  return COMMUNITY_MESSAGES_HREF;
}

type ActiveNurseChat =
  | { kind: "global" }
  | { kind: "nurse"; id: string };

type CommunityNursePageProps = {
  /** Inside {@link CommunityMessagingHub}: tighter chrome, no duplicate inbox link. */
  variant?: "standalone" | "hub";
};

export function CommunityNursePage({
  variant = "standalone",
}: CommunityNursePageProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { user, accessToken, ready, updateUser } = useAuth();
  const inDashboardShell = pathname.startsWith("/dashboard/admin/community");
  const isHub = variant === "hub";

  const [communities, setCommunities] = useState<NurseCommunityListItem[]>([]);
  const [myCommunity, setMyCommunity] = useState<NurseCommunityListItem | null>(
    null,
  );
  /** Super-admin dashboard: pick a nurse community id */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Nurse: exactly one chat open — main room or a joined community */
  const [activeChat, setActiveChat] = useState<ActiveNurseChat>({
    kind: "global",
  });
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof listNurseCommunityMembers>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createRules, setCreateRules] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [globalMentionRows, setGlobalMentionRows] = useState<
    Awaited<ReturnType<typeof fetchGlobalMentionRows>>
  >([]);
  const lastCommunitiesListLoadKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastCommunitiesListLoadKey.current = null;
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const [data, gMentions] = await Promise.all([
        listNurseCommunities(accessToken),
        fetchGlobalMentionRows(accessToken).catch(() => []),
      ]);
      setCommunities(data.items);
      setMyCommunity(data.myCommunity);
      setGlobalMentionRows(gMentions);
      setActiveChat((prev) => {
        if (prev.kind === "nurse") {
          const row = data.items.find((i) => i.id === prev.id);
          if (row && (row.isMember || row.isOwner)) return prev;
        }
        return { kind: "global" };
      });
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load communities");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!ready || !user?.id || !accessToken || user.role !== "nurse") return;
    void getAccountMe(accessToken)
      .then((me) => {
        if (me.communityBannedAt !== undefined) {
          updateUser({
            communityBannedAt: me.communityBannedAt ?? null,
          });
        }
      })
      .catch(() => {});
  }, [ready, user?.id, user?.role, accessToken, updateUser]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const next = communitySignInNextPath(pathname);
      router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    if (
      user.role === "nurse" &&
      user.communityBannedAt &&
      !inDashboardShell
    ) {
      router.replace("/profile/update");
      return;
    }
    if (
      !canAccessCommunity(user.role, {
        communityBannedAt: user.communityBannedAt,
      })
    ) {
      router.replace("/dashboard");
      return;
    }
    if (user.role === "super_admin" && !inDashboardShell) {
      router.replace("/dashboard/admin/community");
    }
  }, [
    ready,
    user?.id,
    user?.role,
    user?.communityBannedAt,
    router,
    pathname,
    inDashboardShell,
  ]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (user.role !== "nurse" && !(user.role === "super_admin" && inDashboardShell)) {
      return;
    }
    const k = `${user.id}:${inDashboardShell}`;
    if (lastCommunitiesListLoadKey.current === k) return;
    lastCommunitiesListLoadKey.current = k;
    void load();
  }, [accessToken, user?.id, user?.role, inDashboardShell, load]);

  const nurseCommunityIdForMembers =
    user?.role === "nurse" && activeChat.kind === "nurse"
      ? activeChat.id
      : user?.role === "super_admin" && inDashboardShell && selectedId
        ? selectedId
        : null;

  useEffect(() => {
    if (!accessToken || !nurseCommunityIdForMembers) {
      setMembers([]);
      return;
    }
    void (async () => {
      try {
        const m = await listNurseCommunityMembers(
          accessToken,
          nurseCommunityIdForMembers,
        );
        setMembers(m);
      } catch {
        setMembers([]);
      }
    })();
  }, [accessToken, nurseCommunityIdForMembers]);

  const joinedCommunities = communities.filter(
    (c) => c.isMember || c.isOwner,
  );
  const discoverCommunities = communities.filter(
    (c) => !c.isMember && !c.isOwner,
  );

  const activeNurseCommunity =
    activeChat.kind === "nurse"
      ? (joinedCommunities.find((c) => c.id === activeChat.id) ?? null)
      : null;

  async function onJoin(c: NurseCommunityListItem) {
    if (!accessToken) return;
    try {
      await joinNurseCommunity(accessToken, c.id);
      await load();
      setActiveChat({ kind: "nurse", id: c.id });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Join failed");
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setCreateBusy(true);
    try {
      const row = await createNurseCommunity(accessToken, {
        name: createName.trim(),
        description: createDesc.trim(),
        rules: createRules.trim(),
      });
      setCreateOpen(false);
      setCreateName("");
      setCreateDesc("");
      setCreateRules("");
      await load();
      setActiveChat({ kind: "nurse", id: row.id });
    } catch (e) {
      if (e instanceof BackendRequestError) {
        alert(e.message);
      } else {
        alert("Could not create community");
      }
    } finally {
      setCreateBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-100 border-t-red-600" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-12 text-center">Redirecting…</div>;
  }

  if (inDashboardShell && user.role === "nurse") {
    return null;
  }

  return (
    <div
      className={`bg-white text-neutral-900 w-full ${
        isHub
          ? "min-h-0 flex-1 overflow-y-auto"
          : inDashboardShell
            ? "min-h-min"
            : "min-h-screen"
      }`}
    >
      {!isHub ? (
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400" />
      ) : null}
      <div
        className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${
          isHub ? "py-5 lg:py-8" : "py-8 lg:py-12"
        }`}
      >
        {!isHub ? (
          <div className="flex flex-col gap-6 pb-10 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tighter sm:text-3xl">
                Community
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-500">
                Use the main room for everyone, or create/join smaller nurse
                communities (one owned per account). Open a name in chat to
                manage image, members, and rules.
              </p>
            </div>
            {user.role === "nurse" && !inDashboardShell && (
              <Link
                href="/community/messages?tab=inbox"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700"
              >
                <Inbox className="h-5 w-5" />
                Inbox
              </Link>
            )}
          </div>
        ) : (
          user.role === "nurse" &&
          !inDashboardShell && (
            <p className="pb-6 text-sm text-neutral-600">
              Main room for everyone, plus nurse communities you create or join.
              Use{" "}
              <span className="font-semibold text-slate-800">Inbox</span> in the
              sidebar for employer messages.
            </p>
          )
        )}

        {createOpen && user.role === "nurse" && (
          <form
            onSubmit={onCreate}
            className="mb-8 rounded-3xl border border-neutral-200 p-6 space-y-3 max-w-lg"
          >
            <h2 className="text-sm font-black uppercase">New community</h2>
            <input
              className="w-full rounded-xl border p-2 text-sm"
              placeholder="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-xl border p-2 text-sm"
              rows={2}
              placeholder="Description"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-xl border p-2 text-sm"
              rows={2}
              placeholder="Rules"
              value={createRules}
              onChange={(e) => setCreateRules(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createBusy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                {createBusy ? "…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && (
          <p className="text-sm text-neutral-400">Loading communities…</p>
        )}
        {loadErr && <p className="text-sm text-red-600">{loadErr}</p>}

        {!loading && !loadErr && user.role === "nurse" && !inDashboardShell && accessToken && (
          <div className="mb-10 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white lg:min-h-[min(640px,calc(100vh-10rem))] lg:flex-row">
            <aside className="flex max-h-[min(50vh,320px)] w-full shrink-0 flex-col border-neutral-200 bg-neutral-50 lg:max-h-none lg:w-72 lg:border-r">
              <div className="border-b border-neutral-200 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Your chats
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                <button
                  type="button"
                  onClick={() => setActiveChat({ kind: "global" })}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                    activeChat.kind === "global"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  <Globe className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="truncate">Main room</span>
                </button>
                {joinedCommunities.map((c) => (
                  <div key={c.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveChat({ kind: "nurse", id: c.id })}
                      className={`min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        activeChat.kind === "nurse" && activeChat.id === c.id
                          ? "bg-red-600 text-white shadow-sm"
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}
                    >
                      {c.name}
                    </button>
                    {c.isOwner && (
                      <Link
                        href={`/community/messages/${c.id}/settings`}
                        className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-200 hover:text-red-600"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-neutral-200 p-2">
                {!myCommunity && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-2 text-xs font-bold uppercase text-neutral-600 hover:border-red-300 hover:text-red-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create community
                  </button>
                )}
                {discoverCommunities.length > 0 && (
                  <details className="group rounded-xl border border-neutral-200 bg-white">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-neutral-600">
                      Browse & join ({discoverCommunities.length})
                    </summary>
                    <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-neutral-100 p-2">
                      {discoverCommunities.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-neutral-50"
                        >
                          <span className="truncate font-medium text-neutral-800">
                            {c.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => void onJoin(c)}
                            className="shrink-0 rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-black uppercase text-white"
                          >
                            Join
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </aside>
            <div className="min-h-[420px] min-w-0 flex-1 lg:min-h-0">
              {activeChat.kind === "global" && (
                <CommunityGroupChat
                  accessToken={accessToken}
                  userId={user.id}
                  viewerRole="nurse"
                  roomMode="global"
                  communityName="Nurse community"
                  members={globalMentionRows.map((r) => ({
                    userId: r.userId,
                    email: r.email,
                    fullName: r.fullName,
                    joinedAt: new Date(0).toISOString(),
                  }))}
                />
              )}
              {activeChat.kind === "nurse" && activeNurseCommunity && (
                <CommunityGroupChat
                  accessToken={accessToken}
                  userId={user.id}
                  viewerRole="nurse"
                  nurseCommunityId={activeNurseCommunity.id}
                  communityName={activeNurseCommunity.name}
                  members={members}
                  settingsHref={
                    activeNurseCommunity.isOwner
                      ? `/community/messages/${activeNurseCommunity.id}/settings`
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        )}

        {!loading && !loadErr && user.role === "super_admin" && inDashboardShell && accessToken && (
          <div className="mb-10 space-y-3">
            <h2 className="text-sm font-black uppercase text-neutral-400">
              Main (global) chat
            </h2>
            <CommunityGroupChat
              accessToken={accessToken}
              userId={user.id}
              viewerRole="super_admin"
              roomMode="global"
              communityName="Nurse community (global)"
              members={globalMentionRows.map((r) => ({
                userId: r.userId,
                email: r.email,
                fullName: r.fullName,
                joinedAt: new Date(0).toISOString(),
              }))}
            />
          </div>
        )}

        {user.role === "super_admin" && inDashboardShell && accessToken && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-black">Global admin view</h2>
            </div>
            {communities.length > 0 && (
              <div className="grid gap-2 sm:max-w-sm">
                {communities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`text-left rounded-xl border px-4 py-2 ${
                      selectedId === c.id
                        ? "border-red-500"
                        : "border-neutral-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {selectedId && (
              <CommunityGroupChat
                accessToken={accessToken}
                userId={user.id}
                viewerRole="super_admin"
                nurseCommunityId={selectedId}
                communityName={
                  communities.find((x) => x.id === selectedId)?.name ?? "Chat"
                }
                members={members}
                settingsHref={`/community/messages/${selectedId}/settings`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
