"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EditProfileModal from "@/components/EditProfileModal";
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth";
import type { ConnectionStatus } from "@/types/connection";
import type { Service } from "@/types/community";
import type { User } from "@/types/user";

function formatMonthYear(date: string | null | undefined): string {
  if (!date) return "";
  const [year, month] = date.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

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
  const [profileServices, setProfileServices] = useState<Service[]>([]);

  const isOwner = me?.username === username;

  useEffect(() => {
    let cancelled = false;
    api.get<User>(`/users/${username}`)
      .then((r) => {
        if (cancelled) return;
        setProfile(r.data);
        api.get<Service[]>(`/services?user_id=${r.data.id}`)
          .then((s) => { if (!cancelled) setProfileServices(s.data); })
          .catch(() => {});
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
        const { data } = await api.post<{ id: string }>(`/connections/${profile.id}`);
        setConnStatus((s) => s ? { ...s, pending_sent: true, connection_id: data.id } : s);
      } else if (connStatus.pending_sent && connStatus.connection_id) {
        await api.delete(`/connections/${connStatus.connection_id}`);
        setConnStatus((s) => s ? { ...s, pending_sent: false, connection_id: null } : s);
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
    if (connStatus.pending_sent) return "Withdraw request";
    if (connStatus.pending_received) return "Accept request";
    return "Connect";
  }

  const initials = profile ? (profile.full_name ?? profile.username).slice(0, 2).toUpperCase() : "";
  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500" data-testid="not-found-message">User <span className="font-semibold">@{username}</span> not found.</p>
        </div>
      </div>
    );
  }

  if (privateProfile) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">This profile is not visible</p>
            <p className="text-gray-500 text-sm">@{username}&apos;s profile is only visible to their connections.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          {me && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <LeftSidebar />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Profile card */}
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
              {/* Cover */}
              <div className="h-32 overflow-hidden">
                {profile.cover_url ? (
                  <img src={mediaUrl(profile.cover_url)!} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[var(--gradient-a)] to-[var(--gradient-b)]" />
                )}
              </div>

              {/* Avatar + actions row */}
              <div className="px-6 pb-4">
                <div className="flex items-end justify-between -mt-12 mb-3">
                  {profile.avatar_url ? (
                    <img
                      src={mediaUrl(profile.avatar_url)!}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1c1c1c] object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1c1c1c] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-3xl">
                      {initials}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    {isOwner ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border-2 border-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors"
                      >
                        Edit profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleConnect}
                          disabled={connecting}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                            connStatus?.connected
                              ? "border-2 border-gray-400 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-400"
                              : connStatus?.pending_received
                              ? "gradient-accent text-white hover:opacity-90"
                              : connStatus?.pending_sent
                              ? "border-2 border-gray-400 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-400"
                              : "gradient-accent text-white hover:opacity-90"
                          }`}
                        >
                          {connectLabel()}
                        </button>
                        <button
                          onClick={() => router.push(`/messages/${profile.username}`)}
                          className="rounded-full border-2 border-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors"
                        >
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.full_name ?? profile.username}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="profile-username">@{profile.username}</p>
                {profile.headline && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-medium" data-testid="profile-headline">{profile.headline}</p>
                )}
                {profile.location && (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1" data-testid="profile-location">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {profile.location}
                  </p>
                )}
                {profile.bio && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">Joined {joinDate}</p>
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5" data-testid="skills-section">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] text-[var(--accent)] text-sm px-3 py-1 rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {profile.work_experience && profile.work_experience.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5" data-testid="experience-section">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Experience</h2>
                <div className="space-y-4">
                  {profile.work_experience.map((exp, i) => (
                    <div key={i} className={i > 0 ? "border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-4" : ""}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{exp.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatMonthYear(exp.start_date)} — {exp.current ? "Present" : formatMonthYear(exp.end_date)}
                          </p>
                          {exp.description && (
                            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5" data-testid="education-section">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Education</h2>
                <div className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <div key={i} className={i > 0 ? "border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-4" : ""}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{edu.school}</p>
                          {(edu.degree || edu.field) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {[edu.degree, edu.field].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {(edu.start_date || edu.end_date) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatMonthYear(edu.start_date)}{edu.end_date ? ` — ${formatMonthYear(edu.end_date)}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {profileServices.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Services</h2>
                <div className="flex flex-col gap-3">
                  {profileServices.map((svc) => {
                    const CAT_COLORS: Record<string, string> = {
                      visa: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                      legal: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
                      finance: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
                      tax: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                      career: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
                      teaching: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
                      language: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
                      housing: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
                      tech: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
                      other: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                    };
                    const CAT_LABELS: Record<string, string> = {
                      visa: "Visa / Immigration", legal: "Legal", finance: "Finance", tax: "Tax",
                      career: "Career", teaching: "Teaching", language: "Language",
                      housing: "Housing", tech: "Tech Help", other: "Other",
                    };
                    return (
                      <div key={svc.id} className="border border-[#E0DFDC] dark:border-[#2E2E2E] rounded-lg p-3 flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[svc.category] ?? "bg-gray-100 text-gray-600"}`}>
                              {CAT_LABELS[svc.category] ?? svc.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.is_paid ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
                              {svc.is_paid ? (svc.price_info ?? "Paid") : "Free"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{svc.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{svc.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity placeholder */}
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-6 text-center text-gray-400 text-sm">
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
