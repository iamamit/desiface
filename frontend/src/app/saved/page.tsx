"use client";

import { useEffect, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";
import type { Post } from "@/types/post";

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Post[]>("/posts/saved")
      .then((r) => setPosts(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-6 flex gap-6">
        <div className="hidden lg:block w-[220px] flex-shrink-0">
          <LeftSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Saved Posts</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 animate-pulse h-32" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No saved posts yet.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tap the bookmark icon on any post to save it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                  onUpdated={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hidden xl:block w-[300px] flex-shrink-0">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
