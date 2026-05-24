"use client";

import { useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/user";

interface Props {
  profile: User;
  onSaved: (updated: User) => void;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onSaved, onClose }: Props) {
  const { fetchMe } = useAuthStore();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch<User>("/users/me", {
        full_name: form.full_name || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      });
      await fetchMe();
      onSaved(data);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DFDC]">
          <h2 className="text-lg font-semibold text-gray-900">Edit intro</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl leading-none">
            ×
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={update("full_name")}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={update("bio")}
              rows={3}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] resize-none"
              placeholder="Tell people a little about yourself"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Avatar URL</label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={update("avatar_url")}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E0DFDC]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-400 px-5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0A66C2] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
