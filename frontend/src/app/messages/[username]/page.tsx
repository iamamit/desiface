"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Message } from "@/types/message";
import type { User } from "@/types/user";

export default function ConversationPage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuthStore();
  const [other, setOther] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<User>(`/users/${username}`).then((r) => {
      setOther(r.data);
      return api.get<Message[]>(`/messages/${r.data.id}`);
    }).then((r) => setMessages(r.data)).catch(() => {});
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !other) return;
    setSending(true);
    try {
      const { data } = await api.post<Message>(`/messages/${other.id}`, { content: text });
      setMessages((prev) => [...prev, data]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 max-w-xl mx-auto w-full">
        {other && (
          <>
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm">
              {(other.full_name ?? other.username).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{other.full_name ?? other.username}</p>
              <p className="text-xs text-gray-400">@{other.username}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-xl mx-auto w-full px-4 py-4 space-y-2">
        {messages.map((m) => {
          const isMine = m.sender.id === me?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-orange-500 text-white rounded-br-sm" : "bg-white text-gray-700 shadow-sm rounded-bl-sm"}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3 max-w-xl mx-auto w-full">
        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
