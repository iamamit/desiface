"use client";

import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import type { Connection } from "@/types/connection";
import type { User } from "@/types/user";

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm flex-shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"friends" | "requests">("friends");

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

  async function sendRequest(userId: string) {
    await api.post(`/connections/${userId}`);
    setSentIds((prev) => new Set([...prev, userId]));
  }

  async function accept(connId: string) {
    const { data } = await api.patch<Connection>(`/connections/${connId}/accept`);
    setRequests((prev) => prev.filter((r) => r.id !== connId));
    setConnections((prev) => [data, ...prev]);
  }

  async function decline(connId: string) {
    await api.patch(`/connections/${connId}/decline`);
    setRequests((prev) => prev.filter((r) => r.id !== connId));
  }

  async function unfriend(connId: string) {
    await api.delete(`/connections/${connId}`);
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4">

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Find people</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username…"
            className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {results.length > 0 && (
            <div className="mt-2 space-y-2">
              {results.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar name={u.full_name ?? u.username} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.full_name ?? u.username}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={sentIds.has(u.id)}
                    className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                  >
                    {sentIds.has(u.id) ? "Sent" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["friends", "requests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? "bg-orange-500 text-white" : "bg-white text-gray-500 hover:bg-gray-100"}`}
            >
              {t === "friends" ? `Friends (${connections.length})` : `Requests (${requests.length})`}
            </button>
          ))}
        </div>

        {/* Friends */}
        {tab === "friends" && (
          <div className="space-y-2">
            {connections.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">No connections yet. Find people above!</div>
            ) : connections.map((c) => {
              const other = c.requester.username === (window as unknown as { __me?: string }).__me ? c.addressee : c.requester;
              return (
                <div key={c.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                  <Avatar name={other.full_name ?? other.username} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{other.full_name ?? other.username}</p>
                    <p className="text-xs text-gray-400">@{other.username}</p>
                  </div>
                  <button onClick={() => unfriend(c.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remove</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Requests */}
        {tab === "requests" && (
          <div className="space-y-2">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">No pending requests.</div>
            ) : requests.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <Avatar name={r.requester.full_name ?? r.requester.username} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.requester.full_name ?? r.requester.username}</p>
                  <p className="text-xs text-gray-400">@{r.requester.username}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => accept(r.id)} className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">Accept</button>
                  <button onClick={() => decline(r.id)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
