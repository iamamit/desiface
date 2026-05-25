"use client";

import { useEffect, useRef, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Post } from "@/types/post";

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [dismissedVerify, setDismissedVerify] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Post[]>("/posts/feed")
      .then((r) => setPosts(r.data))
      .finally(() => setLoading(false));
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url: string | undefined;
      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const { data } = await api.post<{ url: string }>("/posts/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        image_url = data.url;
      }
      const { data } = await api.post<Post>("/posts", { content, image_url, visibility });
      setPosts((prev) => [data, ...prev]);
      setContent("");
      removeImage();
    } finally {
      setPosting(false);
    }
  }

  const initials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4">

          {/* Left sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <LeftSidebar />
            </div>
          </div>

          {/* Main feed */}
          <div className="min-w-0 space-y-2">
            {/* Email verification banner */}
            {user && !user.is_verified && !dismissedVerify && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-amber-800">Please verify your email address.</span>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <button
                    disabled={resendStatus === "sending" || resendStatus === "sent"}
                    onClick={async () => {
                      setResendStatus("sending");
                      try {
                        await api.post("/auth/resend-verification");
                        setResendStatus("sent");
                      } catch {
                        setResendStatus("error");
                      }
                    }}
                    className="text-xs font-semibold text-[#0A66C2] hover:underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus === "sending" ? "Sending…" : resendStatus === "sent" ? "Email sent!" : resendStatus === "error" ? "Failed, try again" : "Resend email"}
                  </button>
                  <button onClick={() => setDismissedVerify(true)} className="text-amber-500 hover:text-amber-700 text-lg leading-none">×</button>
                </div>
              </div>
            )}

            {/* Create post */}
            <div className="bg-white rounded-lg border border-[#E0DFDC] p-3">
              <div className="flex items-start gap-3 mb-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <form onSubmit={handlePost} className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start a post"
                    rows={content || imagePreview ? 3 : 1}
                    className="w-full resize-none text-sm text-gray-700 placeholder-gray-500 border border-[#C0C0C0] rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2] focus:rounded-lg transition-all"
                  />
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg border border-[#E0DFDC] object-cover" />
                      <button
                        type="button"
                        data-testid="remove-image-btn"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {(content.trim() || imagePreview) && (
                    <div className="flex items-center justify-between mt-2">
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as "public" | "friends")}
                        className="text-xs border border-gray-300 rounded-full px-3 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                      >
                        <option value="public">🌐 Public</option>
                        <option value="friends">👥 Connections</option>
                      </select>
                      <button
                        type="submit"
                        disabled={posting}
                        className="rounded-full bg-[#0A66C2] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50 transition-colors"
                      >
                        {posting ? "Posting…" : "Post"}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-1 border-t border-[#E0DFDC] pt-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8h12a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
                  </svg>
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Write article
                </button>
              </div>
            </div>

            {/* Sort bar */}
            {posts.length > 0 && (
              <div className="bg-white rounded-lg border border-[#E0DFDC] px-4 py-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort by:</span>
                <button className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Top
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Feed */}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E0DFDC] p-8 text-center">
                <p className="text-gray-500 text-sm">No posts yet. Connect with people or be the first to post!</p>
              </div>
            ) : (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                  onShared={(newPost) => setPosts((prev) => [newPost, ...prev])}
                />
              ))
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
