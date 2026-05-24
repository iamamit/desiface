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
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
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
  const meInitials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";

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
    <div className="bg-white rounded-lg border border-[#E0DFDC] overflow-hidden" data-testid="post-card">
      {/* Author header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-[#EEF3F8] flex items-center justify-center text-[#0A66C2] text-sm font-bold flex-shrink-0 group-hover:opacity-90">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:underline">
                {post.author.full_name ?? post.author.username}
              </p>
              <p className="text-xs text-gray-500">@{post.author.username}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                {timeAgo(post.created_at)}
                <span>·</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </p>
            </div>
          </Link>
          {isOwner && (
            <button
              onClick={deletePost}
              className="text-gray-400 hover:text-red-400 transition-colors p-1"
              aria-label="Delete"
              title="Delete post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="mt-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        {post.image_url && (
          <img
            src={`http://localhost:8000${post.image_url}`}
            alt="post image"
            className="mt-3 w-full rounded-lg max-h-[500px] object-cover"
          />
        )}

        {/* Reaction + comment counts */}
        {(likeCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between mt-3 pt-2 text-xs text-gray-500">
            {likeCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </span>
                {likeCount}
              </span>
            )}
            {commentCount > 0 && (
              <button onClick={loadComments} className="ml-auto hover:underline">
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-[#E0DFDC] mx-4 mb-1">
        <button
          data-testid="like-btn"
          onClick={toggleLike}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded hover:bg-gray-100 transition-colors ${
            liked ? "text-[#0A66C2]" : "text-gray-600"
          }`}
        >
          <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={liked ? 0 : 1.5} viewBox="0 0 24 24">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span className="hidden sm:inline">
            {liked ? "Liked" : "Like"}
          </span>
          {likeCount > 0 && <span data-testid="like-count-badge" className="text-xs">({likeCount})</span>}
        </button>

        <button
          data-testid="comment-btn"
          onClick={loadComments}
          disabled={loadingComments}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="hidden sm:inline">Comment</span>
          {commentCount > 0 && <span className="text-xs">({commentCount})</span>}
        </button>

        <button className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Repost</span>
        </button>

        <button className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#E0DFDC] pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EEF3F8] flex items-center justify-center text-[#0A66C2] text-xs font-bold flex-shrink-0">
                {(c.author.full_name ?? c.author.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="bg-[#F3F2EF] rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-800">{c.author.full_name ?? c.author.username}</p>
                <p className="text-xs text-gray-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}

          <form onSubmit={submitComment} className="flex gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {meInitials}
            </div>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-full bg-[#F3F2EF] border border-[#C0C0C0] px-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="rounded-full bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#004182] transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
