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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto py-6 px-4">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">Messages</h1>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">
            No messages yet. Visit someone&apos;s profile to start a conversation.
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link key={c.user.id} href={`/messages/${c.user.username}`}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors block"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm flex-shrink-0">
                  {(c.user.full_name ?? c.user.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.user.full_name ?? c.user.username}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(c.last_message_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
                    {c.unread_count > 0 && (
                      <span className="ml-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
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
  );
}
