"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import type { Conversation } from "@/types/message";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Conversation[]>("/messages")
      .then((r) => setConversations(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0DFDC]">
            <h1 className="text-base font-semibold text-gray-900">Messaging</h1>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No messages yet. Visit someone&apos;s profile to start a conversation.
            </div>
          ) : (
            <div>
              {conversations.map((c) => (
                <Link
                  key={c.user.id}
                  href={`/messages/${c.user.username}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#E0DFDC] last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                    {(c.user.full_name ?? c.user.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.user.full_name ?? c.user.username}</p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(c.last_message_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
                      {c.unread_count > 0 && (
                        <span className="ml-2 bg-[var(--accent)] text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold flex-shrink-0 px-1">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
