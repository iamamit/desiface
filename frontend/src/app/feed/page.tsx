"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import OnboardingModal from "@/components/OnboardingModal";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Post, PostTag } from "@/types/post";

const TAGS: { value: PostTag; label: string; color: string }[] = [
  { value: "visa",       label: "Visa",        color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  { value: "legal",      label: "Legal",       color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  { value: "finance",    label: "Finance",     color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  { value: "tax",        label: "Tax",         color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  { value: "career",     label: "Career",      color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  { value: "teaching",   label: "Teaching",    color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" },
  { value: "language",   label: "Language",    color: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300" },
  { value: "housing",    label: "Housing",     color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  { value: "tech",       label: "Tech",        color: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300" },
  { value: "networking", label: "Networking",  color: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300" },
  { value: "cultural",   label: "Cultural",    color: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" },
  { value: "general",    label: "General",     color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
];

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const [selectedTag, setSelectedTag] = useState<PostTag | null>(null);
  const [filterTag, setFilterTag] = useState<PostTag | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const LIMIT = 20;

  const needsOnboarding = !!user && !user.avatar_url && !user.headline &&
    !localStorage.getItem(`onboarding_done_${user.id}`);
  const [showOnboarding, setShowOnboarding] = useState(needsOnboarding);

  useEffect(() => {
    api.get<Post[]>(`/posts/feed?skip=0&limit=${LIMIT}`)
      .then((r) => { setPosts(r.data); setHasMore(r.data.length === LIMIT); })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextSkip = skip + LIMIT;
    try {
      const r = await api.get<Post[]>(`/posts/feed?skip=${nextSkip}&limit=${LIMIT}`);
      setPosts((prev) => [...prev, ...r.data]);
      setSkip(nextSkip);
      setHasMore(r.data.length === LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [skip, hasMore, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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

  async function handlePost(e: React.FormEvent<HTMLFormElement>) {
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
      const { data } = await api.post<Post>("/posts", { content, image_url, visibility, tag: selectedTag });
      setPosts((prev) => [data, ...prev]);
      setContent("");
      setSelectedTag(null);
      removeImage();
    } finally {
      setPosting(false);
    }
  }

  const initials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";
  const visiblePosts = filterTag ? posts.filter((p) => p.tag === filterTag) : posts;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      {showOnboarding && <OnboardingModal onDone={() => setShowOnboarding(false)} />}
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
            {/* Create post */}
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-3">
              <div className="flex items-start gap-3 mb-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <form onSubmit={handlePost} className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start a post"
                    rows={content || imagePreview ? 3 : 1}
                    className="w-full resize-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-500 bg-transparent border border-[#C0C0C0] dark:border-[#3E3E3E] rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:rounded-lg transition-all"
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
                    <div className="mt-2 space-y-2">
                      {/* Tag picker */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 self-center">Tag:</span>
                        {TAGS.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setSelectedTag(selectedTag === t.value ? null : t.value)}
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all border ${
                              selectedTag === t.value
                                ? `${t.color} border-transparent ring-2 ring-[var(--accent)] ring-offset-1`
                                : `${t.color} border-transparent opacity-60 hover:opacity-100`
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as "public" | "friends")}
                          className="text-xs border border-gray-300 dark:border-[#3E3E3E] rounded-full px-3 py-1 bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        >
                          <option value="public">🌐 Public</option>
                          <option value="friends">👥 Connections</option>
                        </select>
                        <button
                          type="submit"
                          disabled={posting}
                          className="rounded-full gradient-accent px-5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                        >
                          {posting ? "Posting…" : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-1 border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded transition-colors">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8h12a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
                  </svg>
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded transition-colors"
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

            {/* Tag filter bar */}
            {posts.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] px-4 py-2.5 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Filter:</span>
                <button
                  onClick={() => setFilterTag(null)}
                  className={`text-xs font-semibold px-3 py-0.5 rounded-full transition-all ${
                    filterTag === null
                      ? "bg-[var(--accent)] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:opacity-80"
                  }`}
                >
                  All
                </button>
                {TAGS.map((t) => (
                  posts.some((p) => p.tag === t.value) && (
                    <button
                      key={t.value}
                      onClick={() => setFilterTag(filterTag === t.value ? null : t.value)}
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all ${t.color} ${
                        filterTag === t.value ? "ring-2 ring-[var(--accent)] ring-offset-1" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                ))}
              </div>
            )}

            {/* Feed */}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {filterTag ? `No posts tagged with "${TAGS.find(t => t.value === filterTag)?.label}".` : "No posts yet. Connect with people or be the first to post!"}
                </p>
              </div>
            ) : (
              <>
                {visiblePosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                    onUpdated={(updated) => setPosts((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                    onShared={(newPost) => setPosts((prev) => [newPost, ...prev])}
                  />
                ))}
                <div ref={sentinelRef} className="h-4" />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">You've seen all posts</p>
                )}
              </>
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
