"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth";

export default function FeedPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-orange-500">Desiface</span>
        <div className="flex items-center gap-4">
          {user && (
            <Link href={`/profile/${user.username}`} className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors">
              @{user.username}
            </Link>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Sign out
          </button>
        </div>
      </nav>
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-700">
            Welcome back, <span className="font-semibold">{user?.full_name ?? user?.username}</span>!
          </p>
          <p className="text-sm text-gray-400 mt-1">Feed coming soon…</p>
        </div>
      </div>
    </div>
  );
}
