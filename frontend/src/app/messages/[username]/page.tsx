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
  const { user: me, token } = useAuthStore();
  const [other, setOther] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    api.get<User>(`/users/${username}`).then((r) => {
      setOther(r.data);
      return api.get<Message[]>(`/messages/${r.data.id}`);
    }).then((r) => setMessages(r.data)).catch(() => {});
  }, [username]);

  useEffect(() => {
    if (!token) return;
    const wsBase = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000").replace(/\/$/, "");
    const wsUrl = `${wsBase}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => [...prev, {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            is_read: false,
            sender: {
              id: data.sender_id,
              username: data.sender_username,
              full_name: data.sender_full_name,
              email: "",
              bio: null,
              avatar_url: null,
              is_verified: false,
              profile_visibility: "public" as const,
              created_at: data.created_at,
            },
            receiver: me!,
          }]);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, me]);

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

  const otherInitials = other ? (other.full_name ?? other.username).slice(0, 2).toUpperCase() : "";

  return (
    <div className="h-screen bg-[var(--bg-base)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-[1080px] mx-auto w-full px-4 py-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-lg border border-[#E0DFDC] flex flex-col overflow-hidden">

          {/* Chat header */}
          {other && (
            <div className="px-4 py-3 border-b border-[#E0DFDC] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                {otherInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{other.full_name ?? other.username}</p>
                <p className="text-xs text-gray-400">@{other.username}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.map((m) => {
              const isMine = m.sender.id === me?.id;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                      isMine
                        ? "bg-[var(--accent)] text-white rounded-br-sm"
                        : "bg-[var(--bg-base)] text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#E0DFDC] px-4 py-3">
            <form onSubmit={send} className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full bg-[var(--bg-base)] border border-[#C0C0C0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="rounded-full gradient-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
