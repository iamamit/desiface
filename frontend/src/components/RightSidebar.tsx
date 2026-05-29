"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import type { User } from "@/types/user";

export default function RightSidebar() {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<User[]>("/users/suggestions?limit=5")
      .then((r) => setSuggestions(r.data))
      .catch(() => {});
  }, []);

  async function connect(userId: string) {
    try {
      await api.post(`/connections/${userId}`);
      setSent((prev) => new Set([...prev, userId]));
    } catch {}
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">People you may know</h3>
          <Link href="/connections" className="text-xs text-[var(--accent)] hover:underline font-semibold">See all</Link>
        </div>
        <div className="space-y-4">
          {suggestions.map((u) => {
            const avatar = mediaUrl(u.avatar_url);
            const initials = (u.full_name ?? u.username).slice(0, 2).toUpperCase();
            return (
              <div key={u.id} className="flex items-start gap-3">
                <Link href={`/profile/${u.username}`} className="flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      {initials}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.username}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline truncate block">
                    {u.full_name ?? u.username}
                  </Link>
                  {u.headline ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.headline}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                  )}
                  {sent.has(u.id) ? (
                    <span className="mt-1.5 inline-block text-xs text-gray-500 dark:text-gray-400 font-medium">Request sent</span>
                  ) : (
                    <button onClick={() => connect(u.id)}
                      className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--accent)] border border-[var(--accent)] rounded-full px-3 py-0.5 hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
