"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EditProfileModal from "@/components/EditProfileModal";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/user";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  const isOwner = me?.username === username;

  useEffect(() => {
    api.get<User>(`/users/${username}`)
      .then((r) => setProfile(r.data))
      .catch((e) => { if (e.response?.status === 404) setNotFound(true); });
  }, [username]);

  function handleSaved(updated: User) {
    setProfile(updated);
    setEditing(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">User <span className="font-semibold">@{username}</span> not found.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile.full_name ?? profile.username).slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/feed")} className="text-xl font-bold text-orange-500">
          Desiface
        </button>
        {isOwner && (
          <button
            onClick={() => useAuthStore.getState().logout() || router.push("/login")}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        )}
      </nav>

      <div className="max-w-2xl mx-auto py-10 px-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {profile.full_name ?? profile.username}
              </h1>
              <p className="text-sm text-gray-400">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
              )}
              <p className="mt-3 text-xs text-gray-400">Joined {joinDate}</p>
            </div>

            {/* Edit button */}
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="flex-shrink-0 rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>

        {/* Posts placeholder */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">
          No posts yet.
        </div>
      </div>

      {editing && (
        <EditProfileModal profile={profile} onSaved={handleSaved} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
