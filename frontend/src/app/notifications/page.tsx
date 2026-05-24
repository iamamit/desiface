"use client";

import { useEffect, useState } from "react";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Notification[]>("/notifications")
      .then((r) => setNotifications(r.data))
      .finally(() => setLoading(false));
    api.post("/notifications/read-all").catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto py-6 px-4">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h1>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">No notifications yet.</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 ${!n.is_read ? "border-l-4 border-orange-400" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm font-bold flex-shrink-0">
                  {(n.actor.full_name ?? n.actor.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{notifText(n)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
