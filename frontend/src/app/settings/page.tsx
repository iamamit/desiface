"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import { useAccentTheme } from "@/components/ThemeProvider";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const THEMES = [
  {
    id: "blue" as const,
    name: "Classic Blue",
    description: "Professional blue — LinkedIn-inspired",
    gradient: "linear-gradient(135deg, #2080D4, #003474)",
    secondary: "#EEF3F8",
  },
  {
    id: "heritage" as const,
    name: "Heritage",
    description: "Indian saffron meets German gold",
    gradient: "linear-gradient(135deg, #F08010, #7A2800)",
    secondary: "#138808",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user, fetchMe } = useAuthStore();
  const { accent, setAccent } = useAccentTheme();
  const [postVisibility, setPostVisibility] = useState<"public" | "friends">("public");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "friends_only">(user?.profile_visibility ?? "public");
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function savePrivacy() {
    setPrivacySaving(true);
    setPrivacySaved(false);
    try {
      await api.patch("/users/me", { profile_visibility: profileVisibility });
      await fetchMe();
      setPrivacySaved(true);
    } finally {
      setPrivacySaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm');
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete("/users/me");
      logout();
      router.push("/login");
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

        {/* Theme */}
        <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Colour theme</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Changes the accent colour across the whole app.</p>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const active = accent === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setAccent(t.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    active
                      ? "border-[var(--accent)]"
                      : "border-[#E0DFDC] dark:border-[#2E2E2E] hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  {/* Colour swatches */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-6 h-6 rounded-full shadow-sm" style={{ background: t.gradient }} />
                    <span className="w-6 h-6 rounded-full shadow-sm border border-gray-200 dark:border-gray-700" style={{ backgroundColor: t.secondary }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
                  {active && (
                    <svg className="absolute top-3 right-3 w-4 h-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile visibility</label>
              <select value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value as "public" | "friends_only")}
                className="w-full border border-[#C0C0C0] dark:border-[#3E3E3E] rounded px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <option value="public">Public — anyone can view your profile</option>
                <option value="friends_only">Connections only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default post visibility</label>
              <select value={postVisibility} onChange={(e) => setPostVisibility(e.target.value as "public" | "friends")}
                className="w-full border border-[#C0C0C0] dark:border-[#3E3E3E] rounded px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <option value="public">Public</option>
                <option value="friends">Connections only</option>
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You can also change visibility per-post when creating.</p>
            </div>
            {privacySaved && <p className="text-green-600 text-sm">Privacy settings saved.</p>}
            <button onClick={savePrivacy} disabled={privacySaving}
              className="rounded-full gradient-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors">
              {privacySaving ? "Saving…" : "Save privacy settings"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-red-200 dark:border-red-900 p-6">
          <h2 className="text-base font-semibold text-red-600 mb-2">Danger zone</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanently delete your account and all of your data. This action cannot be undone.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-[#C0C0C0] dark:border-[#3E3E3E] rounded px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
