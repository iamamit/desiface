"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth";

interface GroupMember {
  user: { id: string; username: string; full_name: string | null; avatar_url: string | null; headline: string | null };
  role: string;
  joined_at: string;
}

interface GroupPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: { id: string; username: string; full_name: string | null; avatar_url: string | null; headline: string | null };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_private: boolean;
  cover_url: string | null;
  created_at: string;
  owner: { id: string; username: string; full_name: string | null };
  member_count: number;
  is_member: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "members">("posts");
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Group>(`/groups/${id}`),
      api.get<GroupPost[]>(`/groups/${id}/posts`),
      api.get<GroupMember[]>(`/groups/${id}/members`),
    ]).then(([g, p, m]) => {
      setGroup(g.data);
      setPosts(p.data);
      setMembers(m.data);
    }).finally(() => setLoading(false));
  }, [id]);

  async function join() {
    setJoining(true);
    try {
      await api.post(`/groups/${id}/join`);
      setGroup((g) => g ? { ...g, is_member: true, member_count: g.member_count + 1 } : g);
    } finally { setJoining(false); }
  }

  async function leave() {
    if (!confirm("Leave this group?")) return;
    setLeaving(true);
    try {
      await api.delete(`/groups/${id}/leave`);
      setGroup((g) => g ? { ...g, is_member: false, member_count: g.member_count - 1 } : g);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "response" in e) {
        const err = e as { response: { data: { detail: string } } };
        alert(err.response?.data?.detail ?? "Cannot leave group.");
      }
    } finally { setLeaving(false); }
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post<GroupPost>(`/groups/${id}/posts`, { content: newPost });
      setPosts((prev) => [data, ...prev]);
      setNewPost("");
    } finally { setPosting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
        <Navbar />
        <div className="max-w-[760px] mx-auto px-4 py-8 space-y-4">
          <div className="h-40 bg-white dark:bg-[#1c1c1c] rounded-lg animate-pulse" />
          <div className="h-60 bg-white dark:bg-[#1c1c1c] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
        <Navbar />
        <div className="max-w-[760px] mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Group not found.</p>
          <Link href="/groups" className="text-[var(--accent)] hover:underline text-sm mt-2 block">← Back to Groups</Link>
        </div>
      </div>
    );
  }

  const meInitials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-6 flex gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Group header */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[var(--gradient-a)] to-[var(--gradient-b)]" />
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
                  {group.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{group.description}</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="capitalize font-medium">{group.category}</span> · {group.member_count} {group.member_count === 1 ? "member" : "members"}
                    {group.is_private && " · Private"}
                  </p>
                </div>
                {user && (
                  group.is_member ? (
                    <button onClick={leave} disabled={leaving}
                      className="rounded-full border border-gray-400 dark:border-gray-600 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E] transition-colors whitespace-nowrap">
                      {leaving ? "Leaving…" : "Leave"}
                    </button>
                  ) : (
                    <button onClick={join} disabled={joining}
                      className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                      {joining ? "Joining…" : "Join Group"}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-[#E0DFDC] dark:border-[#2E2E2E]">
              {(["posts", "members"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${tab === t ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tab === "posts" ? (
            <>
              {/* Compose */}
              {group.is_member && (
                <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
                  <form onSubmit={submitPost} className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {meInitials}
                      </div>
                      <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} rows={3}
                        placeholder={`Share something with ${group.name}…`}
                        className="flex-1 resize-none text-sm text-gray-700 dark:text-gray-300 bg-[var(--bg-base)] dark:bg-[#252525] border border-[#C0C0C0] dark:border-[#3E3E3E] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-gray-400" />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" disabled={posting || !newPost.trim()}
                        className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                        {posting ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet. {group.is_member ? "Be the first to post!" : "Join to post."}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => {
                    const avatar = mediaUrl(p.author.avatar_url);
                    const initials = (p.author.full_name ?? p.author.username).slice(0, 2).toUpperCase();
                    return (
                      <div key={p.id} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Link href={`/profile/${p.author.username}`}>
                            {avatar ? (
                              <img src={avatar} alt={p.author.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
                                {initials}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link href={`/profile/${p.author.username}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                              {p.author.full_name ?? p.author.username}
                            </Link>
                            {p.author.headline && <p className="text-xs text-gray-500 dark:text-gray-400">{p.author.headline}</p>}
                            <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(p.created_at)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                        {p.image_url && <img src={mediaUrl(p.image_url)!} alt="post" className="mt-3 w-full rounded-lg max-h-80 object-cover" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Members tab */
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
              <div className="space-y-3">
                {members.map((m) => {
                  const avatar = mediaUrl(m.user.avatar_url);
                  const initials = (m.user.full_name ?? m.user.username).slice(0, 2).toUpperCase();
                  return (
                    <div key={m.user.id} className="flex items-center gap-3">
                      <Link href={`/profile/${m.user.username}`}>
                        {avatar ? (
                          <img src={avatar} alt={m.user.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${m.user.username}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline truncate block">
                          {m.user.full_name ?? m.user.username}
                        </Link>
                        {m.user.headline && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.user.headline}</p>}
                      </div>
                      {m.role === "admin" && (
                        <span className="text-xs font-semibold text-[var(--accent)] border border-[var(--accent)] rounded-full px-2 py-0.5">Admin</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — group info */}
        <div className="hidden xl:block w-[280px] flex-shrink-0 space-y-4">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">About this group</h3>
            {group.description && <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{group.description}</p>}
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" /></svg>
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </p>
              <p className="flex items-center gap-2 capitalize">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                {group.category}
              </p>
              {group.is_private && (
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Private group
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-[#E0DFDC] dark:border-[#2E2E2E]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Created by</p>
              <Link href={`/profile/${group.owner.username}`} className="text-xs font-semibold text-[var(--accent)] hover:underline">
                {group.owner.full_name ?? group.owner.username}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
