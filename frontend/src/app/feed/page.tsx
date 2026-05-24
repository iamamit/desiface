"use client";

import { useAuthStore } from "@/store/auth";

export default function FeedPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-500">Desiface</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-700">
            Welcome back, <span className="font-semibold">{user?.full_name ?? user?.username}</span>! 🎉
          </p>
          <p className="text-sm text-gray-400 mt-1">Feed coming soon…</p>
        </div>
      </div>
    </div>
  );
}
