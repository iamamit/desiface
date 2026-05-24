"use client";

import Link from "next/link";
import { useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Comment, Post } from "@/types/post";

interface Props {
  post: Post;
  onDeleted?: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostCard({ post, onDeleted }: Props) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id === post.author.id;
  const initials = (post.author.full_name ?? post.author.username).slice(0, 2).toUpperCase();

  async function toggleLike() {
    setLiked((prev) => !prev);
    setLikeCount((prev) => prev + (liked ? -1 : 1));
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => prev + (liked ? 1 : -1));
    }
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const { data } = await api.get<Comment[]>(`/posts/${post.id}/comments`);
      setComments(data);
      setShowComments(true);
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Comment>(`/posts/${post.id}/comments`, { content: newComment });
      setComments((prev) => [...prev, data]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/posts/${post.id}`);
    onDeleted?.(post.id);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {/* Author */}
      <div className="flex items-center justify-between mb-3">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-500 transition-colors">
              {post.author.full_name ?? post.author.username}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        {isOwner && (
          <button onClick={deletePost} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Delete</button>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}>
          <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button onClick={loadComments} disabled={loadingComments} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                {(c.author.full_name ?? c.author.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-1.5 flex-1">
                <p className="text-xs font-semibold text-gray-700">{c.author.full_name ?? c.author.username}</p>
                <p className="text-xs text-gray-600">{c.content}</p>
              </div>
            </div>
          ))}

          <form onSubmit={submitComment} className="flex gap-2 mt-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
