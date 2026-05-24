"use client";

import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import api from "@/lib/api";
import type { Post } from "@/types/post";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Post[]>("/posts/feed")
      .then((r) => setPosts(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post<Post>("/posts", { content });
      setPosts((prev) => [data, ...prev]);
      setContent("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4">

        {/* Create post */}
        <form onSubmit={handlePost} className="bg-white rounded-2xl shadow-sm p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          <div className="flex justify-end mt-2 pt-2 border-t border-gray-50">
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="rounded-full bg-orange-500 px-5 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">No posts yet. Connect with people or be the first to post!</p>
          </div>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
