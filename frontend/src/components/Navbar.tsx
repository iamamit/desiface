"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Post } from "@/types/post";
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
          ? "border-black dark:border-gray-100 text-black dark:text-gray-100"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-100"
      }`}
    >
      <div className="relative">
        {children}
        {unread > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      <span className="mt-0.5">{label}</span>
    </Link>
  );
}

function MobileTabItem({
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
      className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] gap-0.5 transition-colors ${
        active ? "text-[var(--accent)]" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <div className="relative">
        {children}
        {unread > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      <span>{label}</span>
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`relative flex items-center w-12 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 ${
        isDark ? "bg-[var(--accent)]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <svg className="w-3 h-3 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, fetchMe } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [search, setSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Pick<Post, "id" | "content" | "author">[]>([]);
  const [showMore, setShowMore] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchMe().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!search.trim()) { setUserResults([]); setPostResults([]); return; }
    const t = setTimeout(() => {
      api.get<User[]>(`/search/users?q=${encodeURIComponent(search)}&limit=4`).then((r) => setUserResults(r.data)).catch(() => {});
      api.get<Pick<Post, "id" | "content" | "author">[]>(`/search/posts?q=${encodeURIComponent(search)}&limit=3`).then((r) => setPostResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function clearSearch() { setUserResults([]); setPostResults([]); setSearch(""); }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) clearSearch();
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
    <>
      {/* Top navbar */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-[#1c1c1c] border-b border-[#E0DFDC] dark:border-[#2E2E2E] shadow-sm">
        <div className="max-w-[1080px] mx-auto px-4 flex items-center h-14 gap-2">
          {/* Logo */}
          <Link href="/feed" className="flex-shrink-0">
            <div className="w-9 h-9 rounded gradient-accent flex items-center justify-center">
              <span className="text-white font-extrabold text-base italic tracking-tight">df</span>
            </div>
          </Link>

          {/* Search */}
          <div ref={searchRef} className="relative flex-1 md:flex-none">
            <div className="flex items-center bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] rounded px-3 py-2 w-full md:w-60 gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="bg-transparent text-sm focus:outline-none w-full text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
              />
            </div>
            {(userResults.length > 0 || postResults.length > 0) && (
              <div className="absolute top-full mt-1 left-0 w-80 bg-white dark:bg-[#242424] rounded-lg shadow-xl border border-gray-200 dark:border-[#3E3E3E] z-50 overflow-hidden">
                {userResults.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">People</p>
                    {userResults.map((u) => (
                      <button key={u.id} onClick={() => { router.push(`/profile/${u.username}`); clearSearch(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2E2E2E] text-left">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
                          {(u.full_name ?? u.username).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{u.full_name ?? u.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                {postResults.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide border-t border-gray-100 dark:border-[#3E3E3E]">Posts</p>
                    {postResults.map((p) => (
                      <button key={p.id} onClick={() => { router.push(`/profile/${p.author.username}`); clearSearch(); }}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2E2E2E] text-left">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0 mt-0.5">
                          {(p.author.full_name ?? p.author.username).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{p.author.full_name ?? p.author.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{p.content}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 hidden md:block" />

          {/* Desktop nav items */}
          <div className="hidden md:flex items-stretch h-14 gap-1">
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
            <NavItem href="/community" label="Community" active={pathname.startsWith("/community")}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </NavItem>
            <NavItem href="/jobs" label="Jobs" active={pathname.startsWith("/jobs")}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </NavItem>
          </div>

          {/* Desktop theme toggle */}
          <div className="hidden md:flex items-center px-2">
            <ThemeToggle />
          </div>
          <div className="hidden md:block w-px bg-[#E0DFDC] dark:bg-[#2E2E2E] mx-1 self-stretch my-2" />

          {/* Desktop Me dropdown */}
          {user && (
            <div className="hidden md:flex relative group flex-col items-center justify-center px-3 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-100 min-w-[56px]">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-xs mt-0.5 flex items-center gap-0.5">
                Me
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
              <div className="absolute right-0 top-full w-60 bg-white dark:bg-[#242424] rounded-lg shadow-xl border border-gray-200 dark:border-[#3E3E3E] overflow-hidden hidden group-hover:block">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.full_name ?? user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link href={`/profile/${user.username}`}
                    className="block text-center text-sm font-semibold text-[var(--accent)] border border-[var(--accent)] rounded-full py-1.5 hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
                    View Profile
                  </Link>
                </div>
                <div className="border-t border-[#E0DFDC] dark:border-[#3E3E3E] py-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mb-1">Account</p>
                  <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">
                    Settings
                  </Link>
                  {user.is_admin && (
                    <Link href="/admin" className="block w-full text-left px-4 py-2 text-sm text-[var(--accent)] font-medium hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">
                      Admin Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile avatar */}
          {user && (
            <Link href={`/profile/${user.username}`} className="md:hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              )}
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1c1c1c] border-t border-[#E0DFDC] dark:border-[#2E2E2E] safe-area-bottom">
          <div className="flex items-stretch h-14">
            <MobileTabItem href="/feed" label="Home" active={pathname === "/feed"}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </MobileTabItem>
            <MobileTabItem href="/connections" label="Network" active={pathname === "/connections"}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </MobileTabItem>
            <MobileTabItem href="/messages" label="Messaging" unread={unreadMessages} active={pathname.startsWith("/messages")}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </MobileTabItem>
            <MobileTabItem href="/notifications" label="Alerts" unread={unread} active={pathname === "/notifications"}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </MobileTabItem>
            <button
              onClick={() => setShowMore(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 text-[10px] gap-0.5 text-gray-500 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              More
            </button>
          </div>
        </div>
      )}

      {/* Mobile More drawer */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMore(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl pt-4 pb-8 px-4">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

            {/* Quick links grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { href: "/community", label: "Community", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                { href: "/jobs", label: "Jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { href: "/groups", label: "Groups", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                { href: "/saved", label: "Saved", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-xl">
                  <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">{label}</span>
                </Link>
              ))}
            </div>

            {/* Account links */}
            <div className="space-y-0 border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-4">
              {user && (
                <Link href={`/profile/${user.username}`} onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 py-3 border-b border-[#F0F0F0] dark:border-[#2E2E2E]">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.full_name ?? user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">View profile</p>
                  </div>
                </Link>
              )}
              <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-[#2E2E2E]">
                <span className="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
                <ThemeToggle />
              </div>
              <Link href="/settings" onClick={() => setShowMore(false)}
                className="flex items-center py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-[#F0F0F0] dark:border-[#2E2E2E]">
                Settings
              </Link>
              {user?.is_admin && (
                <Link href="/admin" onClick={() => setShowMore(false)}
                  className="flex items-center py-3 text-sm text-[var(--accent)] font-medium border-b border-[#F0F0F0] dark:border-[#2E2E2E]">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={() => { setShowMore(false); handleLogout(); }}
                className="w-full text-left py-3 text-sm text-red-500">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
