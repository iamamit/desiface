"use client";

import { useEffect, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import type { Notification } from "@/types/notification";

function notifText(n: Notification): string {
  const name = n.actor.full_name ?? n.actor.username;
  switch (n.type) {
    case "like": return `${name} liked your post`;
    case "comment": return `${name} commented on your post`;
    case "connection_request": return `${name} sent you a connection request`;
    case "connection_accepted": return `${name} accepted your connection request`;
    default: return `${name} did something`;
  }
}

function notifIcon(type: string) {
  switch (type) {
    case "like": return "👍";
    case "comment": return "💬";
    case "connection_request": return "🤝";
    case "connection_accepted": return "✅";
    default: return "🔔";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<Notification[]>("/notifications")
      .then((r) => setNotifications(r.data))
      .finally(() => setLoading(false));
    api.post("/notifications/read-all").catch(() => {});
  }, []);

  async function acceptRequest(n: Notification) {
    if (!n.entity_id) return;
    try {
      await api.patch(`/connections/${n.entity_id}/accept`);
      setAcceptedIds((prev) => new Set([...prev, n.id]));
    } catch {
      // connection might have been deleted or already accepted
    }
  }

  async function ignoreRequest(n: Notification) {
    if (!n.entity_id) return;
    try {
      await api.patch(`/connections/${n.entity_id}/decline`);
      setIgnoredIds((prev) => new Set([...prev, n.id]));
    } catch {
      // ignore silently
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          <div className="hidden lg:block">
            <div className="sticky top-20">
              <LeftSidebar />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0DFDC]">
                <h1 className="text-base font-semibold text-gray-900">Notifications</h1>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No notifications yet.</div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 px-4 py-3 border-b border-[#E0DFDC] last:border-0 hover:bg-gray-50 ${
                        !n.is_read ? "bg-[var(--accent-light)]" : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                          {(n.actor.full_name ?? n.actor.username).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 text-base">
                          {notifIcon(n.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{notifText(n)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(n.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {n.type === "connection_request" && !acceptedIds.has(n.id) && !ignoredIds.has(n.id) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => acceptRequest(n)}
                              className="rounded-full gradient-accent px-4 py-1 text-xs font-semibold text-white hover:opacity-90 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => ignoreRequest(n)}
                              className="rounded-full border border-gray-400 px-4 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                        {n.type === "connection_request" && acceptedIds.has(n.id) && (
                          <p className="text-xs text-green-600 mt-1 font-medium">Connected ✓</p>
                        )}
                        {n.type === "connection_request" && ignoredIds.has(n.id) && (
                          <p className="text-xs text-gray-400 mt-1">Request ignored</p>
                        )}
                      </div>
                      {!n.is_read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
