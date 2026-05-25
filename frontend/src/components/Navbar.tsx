"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/user";

function NavItem({
  href,
  label,
  unread = 0,
  active,
  children,
}: {
  href: string;
  label: string;
  unread?: number;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center px-3 h-full text-xs min-w-[56px] relative border-b-2 transition-colors ${
        active
          ? "border-black text-black"
          : "border-transparent text-gray-500 hover:text-black"
      }`}
    >
      <div className="relative">
        {children}
        {unread > 0 && (
          <span data-testid="notif-badge" className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      <span className="mt-0.5">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCounts = () => {
      api.get<{ count: number }>("/notifications/unread-count").then((r) => setUnread(r.data.count)).catch(() => {});
      api.get<{ count: number }>("/messages/unread-count").then((r) => setUnreadMessages(r.data.count)).catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
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
    <nav className="sticky top-0 z-40 bg-white border-b border-[#E0DFDC] shadow-sm">
      <div className="max-w-[1080px] mx-auto px-4 flex items-center h-14 gap-2">
        {/* Logo */}
        <Link href="/feed" className="flex-shrink-0">
          <div className="w-9 h-9 rounded bg-[#0A66C2] flex items-center justify-center">
            <span className="text-white font-extrabold text-base italic tracking-tight">df</span>
          </div>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center bg-[#EEF3F8] rounded px-3 py-2 w-60 gap-2">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-sm focus:outline-none w-full text-gray-800 placeholder-gray-500"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { router.push(`/profile/${u.username}`); setResults([]); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#EEF3F8] flex items-center justify-center text-[#0A66C2] text-sm font-bold flex-shrink-0">
                    {(u.full_name ?? u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name ?? u.username}</p>
                    <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Nav items */}
        <div className="flex items-stretch h-14">
          <NavItem href="/feed" label="Home" active={pathname === "/feed"}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </NavItem>

          <NavItem href="/connections" label="My Network" active={pathname === "/connections"}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </NavItem>

          <NavItem href="/messages" label="Messaging" unread={unreadMessages} active={pathname.startsWith("/messages")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </NavItem>

          <NavItem href="/notifications" label="Notifications" unread={unread} active={pathname === "/notifications"}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </NavItem>

          {/* Divider */}
          <div className="w-px bg-[#E0DFDC] mx-1 self-stretch my-2" />

          {/* Me dropdown */}
          {user && (
            <div className="relative group flex flex-col items-center justify-center px-3 cursor-pointer text-gray-500 hover:text-black min-w-[56px]">
              <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-xs mt-0.5 flex items-center gap-0.5">
                Me
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>

              <div className="absolute right-0 top-full w-60 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden hidden group-hover:block">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.full_name ?? user.username}</p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link
                    href={`/profile/${user.username}`}
                    className="block text-center text-sm font-semibold text-[#0A66C2] border border-[#0A66C2] rounded-full py-1.5 hover:bg-[#EEF3F8] transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="border-t border-[#E0DFDC] py-2">
                  <p className="text-xs font-semibold text-gray-500 px-4 mb-1">Account</p>
                  <Link
                    href="/settings"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
