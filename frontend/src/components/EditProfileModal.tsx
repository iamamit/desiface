"use client";

import { useRef, useState } from "react";

import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
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
    profile_visibility: profile.profile_visibility ?? "public",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(mediaUrl(profile.avatar_url));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        await api.post("/users/me/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      const { data } = await api.patch<User>("/users/me", {
        full_name: form.full_name || null,
        bio: form.bio || null,
        profile_visibility: form.profile_visibility,
      });
      await fetchMe();
      onSaved(data);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (profile.full_name ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DFDC]">
          <h2 className="text-lg font-semibold text-gray-900">Edit intro</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-full cursor-pointer group flex-shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#E0DFDC]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-2xl">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 hidden group-hover:flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Profile photo</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[#0A66C2] hover:underline mt-0.5">
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarSelect} data-testid="avatar-input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
            <input type="text" value={form.full_name} onChange={update("full_name")}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              placeholder="Your name" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
            <textarea value={form.bio} onChange={update("bio")} rows={3}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] resize-none"
              placeholder="Tell people a little about yourself" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Profile visibility</label>
            <select value={form.profile_visibility} onChange={update("profile_visibility")}
              className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] bg-white">
              <option value="public">Public — anyone can see your profile</option>
              <option value="friends_only">Connections only</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E0DFDC]">
            <button type="button" onClick={onClose}
              className="rounded-full border border-gray-400 px-5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-full bg-[#0A66C2] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
