"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/user";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ count: number }>("/notifications/unread-count")
      .then((r) => setUnread(r.data.count))
      .catch(() => {});
    const interval = setInterval(() => {
      api.get<{ count: number }>("/notifications/unread-count")
        .then((r) => setUnread(r.data.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get<User[]>(`/search/users?q=${encodeURIComponent(search)}&limit=5`)
        .then((r) => setResults(r.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-4">
        <Link href="/feed" className="text-xl font-bold text-orange-500 flex-shrink-0">Desiface</Link>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-full bg-gray-100 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {results.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { router.push(`/profile/${u.username}`); setResults([]); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold flex-shrink-0">
                    {(u.full_name ?? u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.full_name ?? u.username}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Link href="/connections" className="text-sm text-gray-500 hover:text-orange-500 transition-colors hidden sm:block">People</Link>
          <Link href="/messages" className="text-sm text-gray-500 hover:text-orange-500 transition-colors hidden sm:block">Messages</Link>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-1">
            <svg className="w-5 h-5 text-gray-500 hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          {/* Avatar */}
          {user && (
            <div className="relative group">
              <button className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold">
                {initials}
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border overflow-hidden hidden group-hover:block">
                <Link href={`/profile/${user.username}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
