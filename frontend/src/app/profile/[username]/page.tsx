"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EditProfileModal from "@/components/EditProfileModal";
import LeftSidebar from "@/components/LeftSidebar";
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
  const [privateProfile, setPrivateProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isOwner = me?.username === username;

  useEffect(() => {
    let cancelled = false;
    api.get<User>(`/users/${username}`)
      .then((r) => {
        if (cancelled) return;
        setProfile(r.data);
        if (me && me.username !== username) {
          return api.get<ConnectionStatus>(`/connections/status/${r.data.id}`);
        }
      })
      .then((r) => { if (!cancelled && r) setConnStatus(r.data); })
      .catch((e) => {
        if (cancelled) return;
        const status = e?.response?.status;
        if (status === 404) setNotFound(true);
        else if (status === 403) setPrivateProfile(true);
      });
    return () => { cancelled = true; };
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

  const initials = profile ? (profile.full_name ?? profile.username).slice(0, 2).toUpperCase() : "";
  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">User <span className="font-semibold">@{username}</span> not found.</p>
        </div>
      </div>
    );
  }

  if (privateProfile) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-700 font-semibold mb-1">This profile is not visible</p>
            <p className="text-gray-500 text-sm">@{username}&apos;s profile is only visible to their connections.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          {/* Left sidebar (own info — only if logged in as someone else) */}
          {me && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <LeftSidebar />
              </div>
            </div>
          )}

          {/* Profile card */}
          <div className="space-y-2">
            <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden">
              {/* Cover */}
              <div className="h-32 bg-gradient-to-r from-[#0A66C2] to-[#004182]" />

              {/* Avatar + actions row */}
              <div className="px-6 pb-4">
                <div className="flex items-end justify-between -mt-12 mb-3">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url.startsWith("http") ? profile.avatar_url : `http://localhost:8000${profile.avatar_url}`}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-[#0A66C2] flex items-center justify-center text-white font-bold text-3xl">
                      {initials}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    {isOwner ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border-2 border-[#0A66C2] px-4 py-1.5 text-sm font-semibold text-[#0A66C2] hover:bg-[#EEF3F8] transition-colors"
                      >
                        Edit profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleConnect}
                          disabled={connecting || connStatus?.pending_sent}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                            connStatus?.connected
                              ? "border-2 border-gray-400 text-gray-600 hover:border-red-400 hover:text-red-400"
                              : connStatus?.pending_received
                              ? "bg-[#0A66C2] text-white hover:bg-[#004182]"
                              : connStatus?.pending_sent
                              ? "border-2 border-gray-300 text-gray-400"
                              : "bg-[#0A66C2] text-white hover:bg-[#004182]"
                          }`}
                        >
                          {connectLabel()}
                        </button>
                        <button
                          onClick={() => router.push(`/messages/${profile.username}`)}
                          className="rounded-full border-2 border-[#0A66C2] px-4 py-1.5 text-sm font-semibold text-[#0A66C2] hover:bg-[#EEF3F8] transition-colors"
                        >
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h1 className="text-xl font-bold text-gray-900">{profile.full_name ?? profile.username}</h1>
                <p className="text-sm text-gray-600" data-testid="profile-username">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">Joined {joinDate}</p>
              </div>
            </div>

            {/* Activity section */}
            <div className="bg-white rounded-lg border border-[#E0DFDC] p-6 text-center text-gray-400 text-sm">
              No posts yet.
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          onSaved={(u) => { setProfile(u); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
