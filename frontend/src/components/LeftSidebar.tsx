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
      <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#0A66C2] to-[#004182]" />
        <div className="-mt-8 px-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-16 h-16 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-white bg-[#0A66C2] flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}
        </div>
        <div className="px-4 pt-1 pb-3">
          <Link href={`/profile/${user.username}`} className="font-semibold text-sm text-gray-900 hover:underline">
            {user.full_name ?? user.username}
          </Link>
          <p className="text-xs text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>

        {connectionCount !== null && (
          <div className="border-t border-[#E0DFDC] px-4 py-2">
            <Link href="/connections" className="flex justify-between items-center text-xs py-1 hover:text-[#0A66C2]">
              <span className="text-gray-600">Connections</span>
              <span className="font-semibold text-[#0A66C2]">{connectionCount}</span>
            </Link>
          </div>
        )}

        <div className="border-t border-[#E0DFDC] px-4 py-2">
          <Link
            href={`/profile/${user.username}`}
            className="block text-center text-xs font-semibold text-gray-700 hover:bg-gray-50 py-1.5 rounded"
          >
            View full profile
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
        {[
          { href: "/connections", label: "My Network", icon: "👥" },
          { href: "/messages", label: "Messages", icon: "💬" },
          { href: "/notifications", label: "Notifications", icon: "🔔" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-[#E0DFDC] last:border-0"
          >
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
