"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import type { User } from "@/types/user";

export default function RightSidebar() {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch a broad set of users as suggestions
    api.get<User[]>("/search/users?q=a&limit=5")
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
      <div className="bg-white rounded-lg border border-[#E0DFDC] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-900">People you may know</h3>
          <Link href="/connections" className="text-xs text-[#0A66C2] hover:underline font-semibold">
            See all
          </Link>
        </div>
        <div className="space-y-4">
          {suggestions.map((u) => (
            <div key={u.id} className="flex items-start gap-3">
              <Link href={`/profile/${u.username}`}>
                <div className="w-12 h-12 rounded-full bg-[#EEF3F8] flex items-center justify-center text-[#0A66C2] font-bold text-sm flex-shrink-0">
                  {(u.full_name ?? u.username).slice(0, 2).toUpperCase()}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.username}`} className="text-sm font-semibold text-gray-900 hover:underline truncate block">
                  {u.full_name ?? u.username}
                </Link>
                <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                {sent.has(u.id) ? (
                  <span className="mt-1.5 inline-block text-xs text-gray-500 font-medium">Request sent</span>
                ) : (
                  <button
                    onClick={() => connect(u.id)}
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#0A66C2] border border-[#0A66C2] rounded-full px-3 py-0.5 hover:bg-[#EEF3F8] transition-colors"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
