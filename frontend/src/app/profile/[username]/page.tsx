"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EditProfileModal from "@/components/EditProfileModal";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { ConnectionStatus } from "@/types/connection";
import type { User } from "@/types/user";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isOwner = me?.username === username;

  useEffect(() => {
    api.get<User>(`/users/${username}`)
      .then((r) => {
        setProfile(r.data);
        if (me && me.username !== username) {
          return api.get<ConnectionStatus>(`/connections/status/${r.data.id}`);
        }
      })
      .then((r) => r && setConnStatus(r.data))
      .catch((e) => { if (e.response?.status === 404) setNotFound(true); });
  }, [username, me]);

  async function handleConnect() {
    if (!profile || !connStatus) return;
    setConnecting(true);
    try {
      if (!connStatus.connected && !connStatus.pending_sent && !connStatus.pending_received) {
        await api.post(`/connections/${profile.id}`);
        setConnStatus((s) => s ? { ...s, pending_sent: true } : s);
      } else if (connStatus.pending_received && connStatus.connection_id) {
        await api.patch(`/connections/${connStatus.connection_id}/accept`);
        setConnStatus((s) => s ? { ...s, connected: true, pending_received: false } : s);
      } else if (connStatus.connected && connStatus.connection_id) {
        await api.delete(`/connections/${connStatus.connection_id}`);
        setConnStatus((s) => s ? { ...s, connected: false, connection_id: null } : s);
      }
    } finally {
      setConnecting(false);
    }
  }

  function connectLabel() {
    if (!connStatus) return "Connect";
    if (connStatus.connected) return "Connected ✓";
    if (connStatus.pending_sent) return "Request sent";
    if (connStatus.pending_received) return "Accept request";
    return "Connect";
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">User <span className="font-semibold">@{username}</span> not found.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const initials = (profile.full_name ?? profile.username).slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-start gap-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{profile.full_name ?? profile.username}</h1>
              <p className="text-sm text-gray-400">@{profile.username}</p>
              {profile.bio && <p className="mt-3 text-gray-600 text-sm leading-relaxed">{profile.bio}</p>}
              <p className="mt-3 text-xs text-gray-400">Joined {joinDate}</p>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              {isOwner ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
                >
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConnect}
                    disabled={connecting || connStatus?.pending_sent}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                      connStatus?.connected
                        ? "border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400"
                        : connStatus?.pending_received
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : connStatus?.pending_sent
                        ? "bg-gray-100 text-gray-400"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {connectLabel()}
                  </button>
                  <button
                    onClick={() => router.push(`/messages/${profile.username}`)}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">
          No posts yet.
        </div>
      </div>

      {editing && (
        <EditProfileModal profile={profile} onSaved={(u) => { setProfile(u); setEditing(false); }} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
