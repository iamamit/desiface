"use client";

import { useRef, useState } from "react";

import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/user";

interface Props {
  onDone: () => void;
}

const TOTAL_STEPS = 4;

export default function OnboardingModal({ onDone }: Props) {
  const { user, fetchMe } = useAuthStore();
  const [step, setStep] = useState(1);

  // Step 2 state
  const [headline, setHeadline] = useState(user?.headline || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ? mediaUrl(user.avatar_url) : null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Step 3 state
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  // Step 4 state
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  function dismiss() {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, "1");
    onDone();
  }

  async function goToStep(next: number) {
    if (next === 3 && suggestions.length === 0) {
      setLoadingSuggestions(true);
      try {
        const res = await api.get<User[]>("/users/suggestions?limit=5");
        setSuggestions(res.data);
      } catch { /* empty */ }
      finally { setLoadingSuggestions(false); }
    }
    setStep(next);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        await api.post("/users/me/avatar", fd);
      }
      if (headline.trim()) {
        await api.patch("/users/me", { headline: headline.trim() });
      }
      await fetchMe();
    } catch { /* empty */ }
    finally { setSavingProfile(false); }
    goToStep(3);
  }

  async function sendRequest(userId: string) {
    try {
      await api.post(`/connections/${userId}`);
      setConnected((prev) => new Set(prev).add(userId));
    } catch { /* empty */ }
  }

  async function submitPost() {
    if (!postContent.trim()) { dismiss(); return; }
    setPosting(true);
    try {
      await api.post("/posts", { content: postContent.trim(), visibility: "public" });
      setPosted(true);
      setTimeout(dismiss, 1200);
    } catch { /* empty */ }
    finally { setPosting(false); }
  }

  const firstName = user?.full_name?.split(" ")[0] || user?.username || "there";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= step ? "w-8 bg-[#FF9933]" : "w-4 bg-gray-200 dark:bg-gray-700"}`}
            />
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center">
            <img src="/logo.svg" alt="Desiface" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome, {firstName}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
              Desiface is the professional community for Indians in Germany. Let's get your profile set up in 2 minutes.
            </p>
            <button
              onClick={() => goToStep(2)}
              className="w-full rounded-full bg-[#FF9933] hover:bg-[#e6882e] text-white font-semibold py-3 text-sm transition-colors"
            >
              Get started →
            </button>
            <button onClick={dismiss} className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-full">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2 — Profile basics */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Set up your profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A photo and headline help people know who you are.</p>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={() => avatarRef.current?.click()}
                className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#FF9933] transition-colors"
              >
                {avatarPreview
                  ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                  : <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0" /></svg>
                }
              </div>
              <button onClick={() => avatarRef.current?.click()} className="mt-2 text-xs text-[#FF9933] font-medium">
                {avatarPreview ? "Change photo" : "Add photo"}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setAvatarFile(f);
                  setAvatarPreview(URL.createObjectURL(f));
                }}
              />
            </div>

            {/* Headline */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Software Engineer at BMW"
                maxLength={220}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9933] focus:border-[#FF9933]"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="w-full rounded-full bg-[#FF9933] hover:bg-[#e6882e] disabled:opacity-60 text-white font-semibold py-3 text-sm transition-colors"
            >
              {savingProfile ? "Saving…" : "Save & continue →"}
            </button>
            <button onClick={() => goToStep(3)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-full">
              Skip
            </button>
          </div>
        )}

        {/* Step 3 — Connect with people */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Connect with people</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Indians in Germany you might know.</p>

            {loadingSuggestions ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No suggestions yet — more people are joining every day!</p>
            ) : (
              <div className="space-y-3 mb-5">
                {suggestions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      {s.avatar_url
                        ? <img src={mediaUrl(s.avatar_url)} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{(s.full_name || s.username)[0].toUpperCase()}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.full_name || s.username}</p>
                      {s.headline && <p className="text-xs text-gray-500 truncate">{s.headline}</p>}
                    </div>
                    <button
                      onClick={() => sendRequest(s.id)}
                      disabled={connected.has(s.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${
                        connected.has(s.id)
                          ? "border-gray-200 dark:border-gray-700 text-gray-400 cursor-default"
                          : "border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933] hover:text-white"
                      }`}
                    >
                      {connected.has(s.id) ? "Sent ✓" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => goToStep(4)}
              className="w-full rounded-full bg-[#FF9933] hover:bg-[#e6882e] text-white font-semibold py-3 text-sm transition-colors"
            >
              Continue →
            </button>
            <button onClick={dismiss} className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-full">
              Skip
            </button>
          </div>
        )}

        {/* Step 4 — First post */}
        {step === 4 && (
          <div>
            {posted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">You're all set!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Welcome to Desiface.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Say hello to the community</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Introduce yourself — where are you from, where in Germany are you, what do you do?</p>

                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Hi everyone! I'm..."
                  rows={4}
                  maxLength={3000}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9933] focus:border-[#FF9933] resize-none mb-5"
                />

                <button
                  onClick={submitPost}
                  disabled={posting}
                  className="w-full rounded-full bg-[#FF9933] hover:bg-[#e6882e] disabled:opacity-60 text-white font-semibold py-3 text-sm transition-colors"
                >
                  {posting ? "Posting…" : postContent.trim() ? "Post & finish 🎉" : "Skip & finish"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
