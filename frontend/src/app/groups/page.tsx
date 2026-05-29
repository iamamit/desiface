"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";

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

const CAT_COLORS: Record<string, string> = {
  general: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  tech: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
  career: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  visa: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  language: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  cultural: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  finance: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  housing: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  networking: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
  other: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const CATEGORIES = ["general", "tech", "career", "visa", "language", "cultural", "finance", "housing", "networking", "other"];

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const [form, setForm] = useState({ name: "", description: "", category: "general", is_private: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Group name is required."); return; }
    setSaving(true);
    try {
      const { data } = await api.post<Group>("/groups", form);
      onCreated(data);
      onClose();
    } catch { setError("Failed to create group."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Create a Group</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-full text-lg">×</button>
        </div>
        <form onSubmit={submit}>
          <div className="px-5 py-4 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Group Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Indians in Berlin"
                className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="What is this group about?"
                className="w-full resize-none rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] capitalize">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.is_private} onChange={(e) => setForm((f) => ({ ...f, is_private: e.target.checked }))} className="rounded" />
              Private group (only members can see posts)
            </label>
          </div>
          <div className="px-5 pb-4 flex justify-end gap-2 border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-3">
            <button type="button" onClick={onClose} className="rounded-full border border-gray-400 dark:border-gray-600 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{saving ? "Creating…" : "Create Group"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupCard({ group, onJoined }: { group: Group; onJoined: (id: string) => void }) {
  const [joining, setJoining] = useState(false);

  async function join() {
    setJoining(true);
    try {
      await api.post(`/groups/${group.id}/join`);
      onJoined(group.id);
    } finally { setJoining(false); }
  }

  return (
    <Link href={`/groups/${group.id}`} className="block bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden hover:border-[var(--accent)] transition-colors">
      <div className="h-20 bg-gradient-to-r from-[var(--gradient-a)] to-[var(--gradient-b)]" />
      <div className="p-4 -mt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[group.category] ?? CAT_COLORS.other}`}>
                {group.category}
              </span>
              {group.is_private && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Private
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</h3>
            {group.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{group.description}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{group.member_count} {group.member_count === 1 ? "member" : "members"}</p>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            {group.is_member ? (
              <span className="text-xs font-semibold text-[var(--accent)] border border-[var(--accent)] rounded-full px-3 py-1">Joined</span>
            ) : (
              <button onClick={join} disabled={joining}
                className="text-xs font-semibold rounded-full gradient-accent text-white px-3 py-1 hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                {joining ? "…" : "Join"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get<Group[]>("/groups")
      .then((r) => setGroups(r.data))
      .finally(() => setLoading(false));
  }, []);

  function handleJoined(id: string) {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, is_member: true, member_count: g.member_count + 1 } : g));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-6 flex gap-6">
        <div className="hidden lg:block w-[220px] flex-shrink-0">
          <LeftSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Groups</h2>
            <button onClick={() => setShowModal(true)}
              className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90">
              + Create Group
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] h-40 animate-pulse" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
              <p className="text-4xl mb-3">🫂</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">No groups yet.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create the first group for your community.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g) => <GroupCard key={g.id} group={g} onJoined={handleJoined} />)}
            </div>
          )}
        </div>
        <div className="hidden xl:block w-[300px] flex-shrink-0">
          <RightSidebar />
        </div>
      </div>
      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onCreated={(g) => setGroups((prev) => [g, ...prev])} />}
    </div>
  );
}
