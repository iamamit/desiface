"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user, fetchMe } = useAuthStore();
  const [postVisibility, setPostVisibility] = useState<"public" | "friends">("public");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "friends_only">(user?.profile_visibility ?? "public");
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

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

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      await api.patch("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPwError(detail || "Failed to change password");
    } finally {
      setPwSaving(false);
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
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>

        {/* Change password */}
        <div className="bg-white rounded-lg border border-[#E0DFDC] p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Change password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              />
            </div>
            {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
            {pwSuccess && <p className="text-green-600 text-sm">Password changed successfully.</p>}
            <button
              type="submit"
              disabled={pwSaving}
              className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50 transition-colors"
            >
              {pwSaving ? "Saving…" : "Save password"}
            </button>
          </form>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg border border-[#E0DFDC] p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Privacy</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile visibility</label>
              <select value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value as "public" | "friends_only")}
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]">
                <option value="public">Public — anyone can view your profile</option>
                <option value="friends_only">Connections only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default post visibility</label>
              <select value={postVisibility} onChange={(e) => setPostVisibility(e.target.value as "public" | "friends")}
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]">
                <option value="public">Public</option>
                <option value="friends">Connections only</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">You can also change visibility per-post when creating.</p>
            </div>
            {privacySaved && <p className="text-green-600 text-sm">Privacy settings saved.</p>}
            <button onClick={savePrivacy} disabled={privacySaving}
              className="rounded-full bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50 transition-colors">
              {privacySaving ? "Saving…" : "Save privacy settings"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h2 className="text-base font-semibold text-red-600 mb-2">Danger zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all of your data. This action cannot be undone.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-[#C0C0C0] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
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
