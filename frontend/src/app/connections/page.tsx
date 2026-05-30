"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Connection } from "@/types/connection";
import type { User } from "@/types/user";

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ConnectionsPage() {
  const { user: me } = useAuthStore();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendError, setSendError] = useState<string | null>(null);
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Connection[]>("/connections").then((r) => setConnections(r.data));
    api.get<Connection[]>("/connections/requests").then((r) => setRequests(r.data));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get<User[]>(`/search/users?q=${encodeURIComponent(search)}&limit=8`)
        .then((r) => setResults(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const connectedIds = new Set(connections.map((c) =>
    c.requester.id === me?.id ? c.addressee.id : c.requester.id
  ));

  async function sendRequest(userId: string) {
    setSendError(null);
    try {
      await api.post(`/connections/${userId}`);
      setSentIds((prev) => new Set([...prev, userId]));
    } catch {
      setSendError("Could not send request. You may already be connected.");
    }
  }

  async function accept(connId: string) {
    setAcceptError(null);
    try {
      const { data } = await api.patch<Connection>(`/connections/${connId}/accept`);
      setRequests((prev) => prev.filter((r) => r.id !== connId));
      setConnections((prev) => [data, ...prev]);
    } catch {
      setAcceptError("Failed to accept request. Please try again.");
    }
  }

  async function decline(connId: string) {
    try {
      await api.patch(`/connections/${connId}/decline`);
      setRequests((prev) => prev.filter((r) => r.id !== connId));
    } catch {
      setAcceptError("Failed to ignore request. Please try again.");
    }
  }

  async function unfriend(connId: string) {
    await api.delete(`/connections/${connId}`);
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          <div className="hidden lg:block">
            <div className="sticky top-20">
              <LeftSidebar />
            </div>
          </div>

          <div className="space-y-3">
            {/* Search */}
            <div className="bg-white rounded-lg border border-[#E0DFDC] p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Find people</p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or username…"
                className="w-full rounded-lg bg-[var(--accent-light)] border border-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              />
              {sendError && (
                <p className="mt-2 text-xs text-red-500">{sendError}</p>
              )}
              {results.length > 0 && (
                <div className="mt-3 space-y-3">
                  {results.map((u) => {
                    const isConnected = connectedIds.has(u.id);
                    const isSent = sentIds.has(u.id);
                    const isMe = u.id === me?.id;
                    return (
                      <div key={u.id} className="flex items-center gap-3">
                        <Link href={`/profile/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={u.full_name ?? u.username} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate hover:underline">{u.full_name ?? u.username}</p>
                            <p className="text-xs text-gray-500">@{u.username}</p>
                          </div>
                        </Link>
                        {!isMe && (
                          isConnected ? (
                            <span className="text-xs text-gray-400 border border-gray-300 rounded-full px-3 py-1.5">Connected</span>
                          ) : (
                            <button
                              onClick={() => sendRequest(u.id)}
                              disabled={isSent}
                              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                                isSent
                                  ? "border border-gray-300 text-gray-400"
                                  : "border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)]"
                              }`}
                            >
                              {isSent ? "Sent" : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                  Connect
                                </>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
              <div className="flex border-b border-[#E0DFDC]">
                {(["friends", "requests"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      tab === t
                        ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {t === "friends" ? `Friends (${connections.length})` : `Requests (${requests.length})`}
                  </button>
                ))}
              </div>

              {/* Friends */}
              {tab === "friends" && (
                <div>
                  {connections.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No connections yet. Find people above!</div>
                  ) : connections.map((c) => {
                    const other = c.requester.id === me?.id ? c.addressee : c.requester;
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#E0DFDC] last:border-0 hover:bg-gray-50">
                        <Link href={`/profile/${other.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={other.full_name ?? other.username} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate hover:underline">{other.full_name ?? other.username}</p>
                            <p className="text-xs text-gray-500">@{other.username}</p>
                          </div>
                        </Link>
                        <button onClick={() => unfriend(c.id)} className="text-xs text-gray-400 hover:text-red-400 border border-gray-300 rounded-full px-3 py-1 transition-colors">
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Requests */}
              {tab === "requests" && (
                <div>
                  {acceptError && (
                    <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-500">{acceptError}</div>
                  )}
                  {requests.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No pending requests.</div>
                  ) : requests.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#E0DFDC] last:border-0 hover:bg-gray-50">
                      <Link href={`/profile/${r.requester.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={r.requester.full_name ?? r.requester.username} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate hover:underline">{r.requester.full_name ?? r.requester.username}</p>
                          <p className="text-xs text-gray-500">@{r.requester.username}</p>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <button onClick={() => accept(r.id)} className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-colors">Accept</button>
                        <button onClick={() => decline(r.id)} className="rounded-full border-2 border-gray-400 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Ignore</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
