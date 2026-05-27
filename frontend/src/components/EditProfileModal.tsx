"use client";

import { useRef, useState } from "react";

import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth";
import type { Education, User, WorkExperience } from "@/types/user";

interface Props {
  profile: User;
  onSaved: (updated: User) => void;
  onClose: () => void;
}

type Tab = "basic" | "experience" | "education" | "skills";

const emptyExp = (): WorkExperience => ({
  title: "",
  company: "",
  start_date: "",
  end_date: null,
  current: false,
  description: null,
});

const emptyEdu = (): Education => ({
  school: "",
  degree: null,
  field: null,
  start_date: "",
  end_date: null,
});

export default function EditProfileModal({ profile, onSaved, onClose }: Props) {
  const { fetchMe } = useAuthStore();
  const [tab, setTab] = useState<Tab>("basic");

  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    bio: profile.bio ?? "",
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    profile_visibility: profile.profile_visibility ?? "public",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(mediaUrl(profile.avatar_url));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(mediaUrl(profile.cover_url));

  const [experiences, setExperiences] = useState<WorkExperience[]>(
    profile.work_experience ?? []
  );
  const [educations, setEducations] = useState<Education[]>(
    profile.education ?? []
  );
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  function updateForm(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  // Work experience helpers
  function updateExp(index: number, field: keyof WorkExperience, value: string | boolean | null) {
    setExperiences((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }
  function addExp() { setExperiences((prev) => [...prev, emptyExp()]); }
  function removeExp(index: number) { setExperiences((prev) => prev.filter((_, i) => i !== index)); }

  // Education helpers
  function updateEdu(index: number, field: keyof Education, value: string | null) {
    setEducations((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }
  function addEdu() { setEducations((prev) => [...prev, emptyEdu()]); }
  function removeEdu(index: number) { setEducations((prev) => prev.filter((_, i) => i !== index)); }

  // Skill helpers
  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  }
  function removeSkill(s: string) { setSkills((prev) => prev.filter((x) => x !== s)); }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        await api.post("/users/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        await api.post("/users/me/cover", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      const { data } = await api.patch<User>("/users/me", {
        full_name: form.full_name || null,
        bio: form.bio || null,
        headline: form.headline || null,
        location: form.location || null,
        profile_visibility: form.profile_visibility,
        work_experience: experiences.length ? experiences : null,
        education: educations.length ? educations : null,
        skills: skills.length ? skills : null,
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "Basic info" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" data-testid="edit-profile-modal">
      <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E] flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E0DFDC] dark:border-[#2E2E2E] flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 flex-shrink-0">{error}</div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">

            {/* Basic info tab */}
            {tab === "basic" && (
              <>
                {/* Cover photo */}
                <div data-testid="cover-photo-section">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cover photo</p>
                  <div
                    className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => coverRef.current?.click()}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[var(--gradient-a)] to-[var(--gradient-b)]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">Change cover photo</span>
                    </div>
                    <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleCoverSelect} data-testid="cover-input" />
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-20 h-20 rounded-full cursor-pointer group flex-shrink-0"
                    onClick={() => avatarRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#E0DFDC]" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-2xl">
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
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile photo</p>
                    <button type="button" onClick={() => avatarRef.current?.click()} className="text-xs text-[var(--accent)] hover:underline mt-0.5">
                      {avatarPreview ? "Change photo" : "Upload photo"}
                    </button>
                    <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarSelect} data-testid="avatar-input" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full name</label>
                  <input type="text" value={form.full_name} onChange={updateForm("full_name")}
                    className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                    placeholder="Your name" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                  <input type="text" value={form.headline} onChange={updateForm("headline")}
                    maxLength={220}
                    className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                    placeholder="e.g. Software Engineer at Desiface" />
                  <p className="text-xs text-gray-400 mt-0.5 text-right">{form.headline.length}/220</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={updateForm("location")}
                    maxLength={100}
                    className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                    placeholder="e.g. Berlin, Germany" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={updateForm("bio")} rows={3}
                    className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
                    placeholder="Tell people a little about yourself" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Profile visibility</label>
                  <select value={form.profile_visibility} onChange={updateForm("profile_visibility")}
                    className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]">
                    <option value="public">Public — anyone can see your profile</option>
                    <option value="friends_only">Connections only</option>
                  </select>
                </div>
              </>
            )}

            {/* Experience tab */}
            {tab === "experience" && (
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <div key={i} className="border border-gray-200 dark:border-[#2E2E2E] rounded-lg p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removeExp(i)}
                      data-testid={`remove-exp-${i}`}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg leading-none"
                    >×</button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Job title *</label>
                        <input type="text" value={exp.title} onChange={(e) => updateExp(i, "title", e.target.value)} required
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          placeholder="Software Engineer" data-testid={`exp-title-${i}`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Company *</label>
                        <input type="text" value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)} required
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          placeholder="Acme Inc." data-testid={`exp-company-${i}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Start date *</label>
                        <input type="month" value={exp.start_date} onChange={(e) => updateExp(i, "start_date", e.target.value)} required
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">End date</label>
                        <input type="month" value={exp.end_date ?? ""} onChange={(e) => updateExp(i, "end_date", e.target.value || null)} disabled={exp.current}
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-40" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input type="checkbox" checked={exp.current} onChange={(e) => { updateExp(i, "current", e.target.checked); if (e.target.checked) updateExp(i, "end_date", null); }}
                        className="rounded accent-[var(--accent)]" />
                      I currently work here
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</label>
                      <textarea value={exp.description ?? ""} onChange={(e) => updateExp(i, "description", e.target.value || null)} rows={2}
                        className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                        placeholder="Describe your role..." />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addExp}
                  data-testid="add-experience"
                  className="w-full py-2 rounded-lg border-2 border-dashed border-[var(--accent)] text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
                  + Add experience
                </button>
              </div>
            )}

            {/* Education tab */}
            {tab === "education" && (
              <div className="space-y-4">
                {educations.map((edu, i) => (
                  <div key={i} className="border border-gray-200 dark:border-[#2E2E2E] rounded-lg p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removeEdu(i)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg leading-none"
                    >×</button>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">School *</label>
                      <input type="text" value={edu.school} onChange={(e) => updateEdu(i, "school", e.target.value)} required
                        className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="University of Berlin" data-testid={`edu-school-${i}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Degree</label>
                        <input type="text" value={edu.degree ?? ""} onChange={(e) => updateEdu(i, "degree", e.target.value || null)}
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          placeholder="B.Sc." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Field of study</label>
                        <input type="text" value={edu.field ?? ""} onChange={(e) => updateEdu(i, "field", e.target.value || null)}
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          placeholder="Computer Science" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Start date *</label>
                        <input type="month" value={edu.start_date} onChange={(e) => updateEdu(i, "start_date", e.target.value)} required
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">End date</label>
                        <input type="month" value={edu.end_date ?? ""} onChange={(e) => updateEdu(i, "end_date", e.target.value || null)}
                          className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addEdu}
                  data-testid="add-education"
                  className="w-full py-2 rounded-lg border-2 border-dashed border-[var(--accent)] text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
                  + Add education
                </button>
              </div>
            )}

            {/* Skills tab */}
            {tab === "skills" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    className="flex-1 rounded border border-gray-300 dark:border-[#3E3E3E] bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="Type a skill and press Enter or Add"
                    data-testid="skill-input"
                  />
                  <button type="button" onClick={addSkill}
                    className="px-4 py-2 rounded text-sm font-semibold gradient-accent text-white hover:opacity-90 transition-opacity">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="flex items-center gap-1 bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] text-[var(--accent)] text-sm px-3 py-1 rounded-full font-medium">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="ml-1 text-[var(--accent)] hover:text-red-500 leading-none text-base" data-testid={`remove-skill-${s}`}>×</button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-gray-400">No skills added yet. Add skills to showcase your expertise.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E0DFDC] dark:border-[#2E2E2E] flex-shrink-0">
            <button type="button" onClick={onClose}
              className="rounded-full border border-gray-400 dark:border-[#3E3E3E] px-5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-full gradient-accent px-5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
