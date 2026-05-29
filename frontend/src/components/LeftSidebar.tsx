"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Connection } from "@/types/connection";

export default function LeftSidebar() {
  const { user } = useAuthStore();
  const [connectionCount, setConnectionCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<Connection[]>("/connections")
      .then((r) => setConnectionCount(r.data.length))
      .catch(() => {});
  }, []);

  if (!user) return null;

  const initials = (user.full_name ?? user.username).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-2">
      {/* Profile card */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[var(--gradient-a)] to-[var(--gradient-b)]" />
        <div className="-mt-8 px-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-16 h-16 rounded-full border-2 border-white dark:border-[#1c1c1c] object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-white dark:border-[#1c1c1c] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}
        </div>
        <div className="px-4 pt-1 pb-3">
          <Link href={`/profile/${user.username}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:underline">
            {user.full_name ?? user.username}
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
          {user.headline && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2 font-medium">{user.headline}</p>
          )}
          {user.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {user.location}
            </p>
          )}
          {!user.headline && user.bio && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>

        {connectionCount !== null && (
          <div className="border-t border-[#E0DFDC] dark:border-[#2E2E2E] px-4 py-2">
            <Link href="/connections" className="flex justify-between items-center text-xs py-1 hover:text-[var(--accent)]">
              <span className="text-gray-600 dark:text-gray-400">Connections</span>
              <span className="font-semibold text-[var(--accent)]">{connectionCount}</span>
            </Link>
          </div>
        )}

        <div className="border-t border-[#E0DFDC] dark:border-[#2E2E2E] px-4 py-2">
          <Link
            href={`/profile/${user.username}`}
            className="block text-center text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] py-1.5 rounded"
          >
            View full profile
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
        {[
          { href: "/connections", label: "My Network", icon: "👥" },
          { href: "/messages", label: "Messages", icon: "💬" },
          { href: "/notifications", label: "Notifications", icon: "🔔" },
          { href: "/saved", label: "Saved Posts", icon: "🔖" },
          { href: "/jobs", label: "Jobs", icon: "💼" },
          { href: "/groups", label: "Groups", icon: "🫂" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] border-b border-[#E0DFDC] dark:border-[#2E2E2E] last:border-0"
          >
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
