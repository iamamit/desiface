"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import api from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth";
import type { Comment, Post } from "@/types/post";

const TAG_STYLES: Record<string, string> = {
  visa:       "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  legal:      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  finance:    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  tax:        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  career:     "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  teaching:   "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  language:   "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  housing:    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  tech:       "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
  networking: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
  cultural:   "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  general:    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};
const TAG_LABELS: Record<string, string> = {
  visa: "Visa / Immigration", legal: "Legal", finance: "Finance", tax: "Tax",
  career: "Career", teaching: "Teaching", language: "Language",
  housing: "Housing", tech: "Tech Help", networking: "Networking",
  cultural: "Cultural", general: "General",
};

const REACTIONS = [
  { type: "like",        emoji: "👍", label: "Like" },
  { type: "love",        emoji: "❤️", label: "Love" },
  { type: "celebrate",   emoji: "🎉", label: "Celebrate" },
  { type: "insightful",  emoji: "💡", label: "Insightful" },
  { type: "funny",       emoji: "😄", label: "Funny" },
];

const REACTION_EMOJI: Record<string, string> = Object.fromEntries(REACTIONS.map((r) => [r.type, r.emoji]));

interface Props {
  post: Post;
  onDeleted?: (id: string) => void;
  onUpdated?: (updated: Post) => void;
  onShared?: (newPost: Post) => void;
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

function SharedPostEmbed({ post }: { post: Post["shared_post"] }) {
  if (!post) return null;
  const initials = (post.author.full_name ?? post.author.username).slice(0, 2).toUpperCase();
  return (
    <div className="mt-3 border border-[#E0DFDC] dark:border-[#2E2E2E] rounded-lg p-3 bg-[#F9F9F9] dark:bg-[#252525]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{post.author.full_name ?? post.author.username}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.created_at)}</p>
        </div>
      </div>
      {post.content && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
      {post.image_url && <img src={mediaUrl(post.image_url)!} alt="shared post" className="mt-2 w-full rounded-lg max-h-48 object-cover" />}
    </div>
  );
}

function ShareModal({ post, onClose, onShared }: { post: Post; onClose: () => void; onShared?: (p: Post) => void }) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const [sharing, setSharing] = useState(false);
  async function share() {
    setSharing(true);
    try {
      const { data } = await api.post<Post>("/posts", { content: caption, shared_post_id: post.id, visibility });
      onShared?.(data);
      onClose();
    } finally { setSharing(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share post</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-full text-lg">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about this…" rows={3}
            className="w-full resize-none text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1A1A1A] border border-[#C0C0C0] dark:border-[#3E3E3E] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-gray-400" />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "friends")}
            className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
            <option value="public">Public</option>
            <option value="friends">Connections only</option>
          </select>
          <div className="border border-[#E0DFDC] dark:border-[#2E2E2E] rounded-lg p-3 bg-[#F9F9F9] dark:bg-[#252525] text-sm text-gray-600 dark:text-gray-400 truncate">
            Sharing: {post.author.full_name ?? post.author.username}&apos;s post
          </div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-gray-400 dark:border-gray-600 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">Cancel</button>
          <button onClick={share} disabled={sharing} className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{sharing ? "Sharing…" : "Share"}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ post, onClose, onSaved }: { post: Post; onClose: () => void; onSaved: (p: Post) => void }) {
  const TAGS = [
    { value: "visa", label: "Visa / Immigration" }, { value: "legal", label: "Legal" },
    { value: "finance", label: "Finance" }, { value: "tax", label: "Tax" },
    { value: "career", label: "Career" }, { value: "teaching", label: "Teaching" },
    { value: "language", label: "Language" }, { value: "housing", label: "Housing" },
    { value: "tech", label: "Tech Help" }, { value: "networking", label: "Networking" },
    { value: "cultural", label: "Cultural" }, { value: "general", label: "General" },
  ];
  const [content, setContent] = useState(post.content);
  const [tag, setTag] = useState(post.tag ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.patch<Post>(`/posts/${post.id}`, { content, tag: tag || null });
      onSaved(data);
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Edit post</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-full text-lg">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
            className="w-full resize-none text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1A1A1A] border border-[#C0C0C0] dark:border-[#3E3E3E] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
          <select value={tag} onChange={(e) => setTag(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
            <option value="">No tag</option>
            {TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-gray-400 dark:border-gray-600 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">Cancel</button>
          <button onClick={save} disabled={saving || !content.trim()} className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function CommentRow({ comment, me, onReply }: {
  comment: Comment;
  me: { id: string; full_name?: string | null; username: string } | null;
  onReply: (parentId: string, parentAuthor: string) => void;
}) {
  const initials = (comment.author.full_name ?? comment.author.username).slice(0, 2).toUpperCase();
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1">
        <div className="bg-[var(--bg-base)] dark:bg-[#252525] rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{comment.author.full_name ?? comment.author.username}</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        </div>
        {me && (
          <button onClick={() => onReply(comment.id, comment.author.full_name ?? comment.author.username)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-[var(--accent)] mt-1 ml-1">
            Reply
          </button>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-2">
            {comment.replies.map((r) => (
              <div key={r.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-[10px] font-bold flex-shrink-0">
                  {(r.author.full_name ?? r.author.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="bg-[var(--bg-base)] dark:bg-[#252525] rounded-lg px-3 py-1.5 flex-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.author.full_name ?? r.author.username}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{r.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostCard({ post, onDeleted, onUpdated, onShared }: Props) {
  const { user } = useAuthStore();
  const [myReaction, setMyReaction] = useState(post.my_reaction ?? null);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.saved_by_me ?? false);
  const [showReactions, setShowReactions] = useState(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === post.author.id;
  const initials = (currentPost.author.full_name ?? currentPost.author.username).slice(0, 2).toUpperCase();
  const meInitials = user ? (user.full_name ?? user.username).slice(0, 2).toUpperCase() : "";
  const avatarSrc = mediaUrl(currentPost.author.avatar_url);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function startReactionHover() {
    reactionTimer.current = setTimeout(() => setShowReactions(true), 400);
  }
  function stopReactionHover() {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setTimeout(() => setShowReactions(false), 300);
  }

  async function react(type: string) {
    setShowReactions(false);
    const prev = myReaction;
    const wasSame = prev === type;
    setMyReaction(wasSame ? null : type);
    setLikeCount((c) => c + (wasSame ? -1 : prev ? 0 : 1));
    try {
      await api.post(`/posts/${post.id}/react`, { reaction_type: type });
    } catch {
      setMyReaction(prev);
      setLikeCount((c) => c + (wasSame ? 1 : prev ? 0 : -1));
    }
  }

  async function toggleSave() {
    setSaved((s) => !s);
    try { await api.post(`/posts/${post.id}/save`); }
    catch { setSaved((s) => !s); }
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const { data } = await api.get<Comment[]>(`/posts/${post.id}/comments`);
      setComments(data);
      setShowComments(true);
    } finally { setLoadingComments(false); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Comment>(`/posts/${post.id}/comments`, {
        content: newComment,
        parent_id: replyTo?.id ?? null,
      });
      if (replyTo) {
        setComments((prev) => prev.map((c) =>
          c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), data] } : c
        ));
      } else {
        setComments((prev) => [...prev, { ...data, replies: [] }]);
        setCommentCount((n) => n + 1);
      }
      setNewComment("");
      setReplyTo(null);
    } finally { setSubmitting(false); }
  }

  async function deletePost() {
    setShowMenu(false);
    if (!confirm("Delete this post?")) return;
    await api.delete(`/posts/${post.id}`);
    onDeleted?.(post.id);
  }

  function handleReplyClick(parentId: string, parentAuthor: string) {
    setReplyTo({ id: parentId, author: parentAuthor });
    setShowComments(true);
    if (!showComments) loadComments();
  }

  return (
    <>
      <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden" data-testid="post-card">
        {/* Author header */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <Link href={`/profile/${currentPost.author.username}`} className="flex items-center gap-3 group">
              {avatarSrc ? (
                <img src={avatarSrc} alt={currentPost.author.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] flex items-center justify-center text-[var(--accent)] text-sm font-bold flex-shrink-0 group-hover:opacity-90">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:underline">
                  {currentPost.author.full_name ?? currentPost.author.username}
                </p>
                {currentPost.author.headline && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{currentPost.author.headline}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                  {timeAgo(currentPost.created_at)}
                  <span>·</span>
                  {currentPost.visibility === "friends" ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                  )}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Save button */}
              <button onClick={toggleSave} title={saved ? "Unsave" : "Save"}
                className={`p-1.5 rounded-full transition-colors ${saved ? "text-[var(--accent)]" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>

              {/* Three-dot menu (own posts only) */}
              {isOwner && (
                <div ref={menuRef} className="relative">
                  <button onClick={() => setShowMenu((v) => !v)} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-7 w-36 bg-white dark:bg-[#242424] rounded-lg shadow-xl border border-gray-200 dark:border-[#3E3E3E] z-10 overflow-hidden">
                      <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button onClick={deletePost}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tag badge */}
          {currentPost.tag && (
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${TAG_STYLES[currentPost.tag] ?? "bg-gray-100 text-gray-600"}`}>
              {TAG_LABELS[currentPost.tag] ?? currentPost.tag}
            </span>
          )}

          {/* Content */}
          {currentPost.content && (
            <p className="mt-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{currentPost.content}</p>
          )}
          {currentPost.image_url && (
            <img src={mediaUrl(currentPost.image_url)!} alt="post image" className="mt-3 w-full rounded-lg max-h-[500px] object-cover" />
          )}
          {currentPost.shared_post && <SharedPostEmbed post={currentPost.shared_post} />}

          {/* Reaction + comment counts row */}
          {(likeCount > 0 || commentCount > 0) && (
            <div className="flex items-center justify-between mt-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
              {likeCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="flex -space-x-1">
                    {(currentPost.reactions ?? []).slice(0, 3).map((r) => (
                      <span key={r.type} className="text-sm">{REACTION_EMOJI[r.type] ?? "👍"}</span>
                    ))}
                    {!(currentPost.reactions?.length) && <span className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg></span>}
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
        <div className="flex border-t border-[#E0DFDC] dark:border-[#2E2E2E] mx-4 mb-1">
          {/* Reaction button with hover picker */}
          <div className="relative flex-1"
            onMouseEnter={startReactionHover}
            onMouseLeave={stopReactionHover}>
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white dark:bg-[#242424] rounded-full shadow-xl border border-gray-200 dark:border-[#3E3E3E] px-2 py-1.5 z-20">
                {REACTIONS.map((r) => (
                  <button key={r.type} onClick={() => react(r.type)} title={r.label}
                    className="text-xl hover:scale-125 transition-transform px-0.5">
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              data-testid="like-btn"
              onClick={() => react(myReaction ?? "like")}
              className={`flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors ${myReaction ? "text-[var(--accent)]" : "text-gray-600 dark:text-gray-400"}`}
            >
              <span className="text-base leading-none">{myReaction ? (REACTION_EMOJI[myReaction] ?? "👍") : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg>
              )}</span>
              <span className="hidden sm:inline">{myReaction ? (REACTIONS.find((r) => r.type === myReaction)?.label ?? "Liked") : "Like"}</span>
              {likeCount > 0 && <span data-testid="like-count-badge" className="text-xs">({likeCount})</span>}
            </button>
          </div>

          <button data-testid="comment-btn" onClick={loadComments} disabled={loadingComments}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            <span className="hidden sm:inline">Comment</span>
            {commentCount > 0 && <span className="text-xs">({commentCount})</span>}
          </button>

          <button data-testid="share-btn" onClick={() => setShowShareModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="hidden sm:inline">Repost</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-3">
            {comments.map((c) => (
              <CommentRow key={c.id} comment={c} me={user} onReply={handleReplyClick} />
            ))}
            <form onSubmit={submitComment} className="flex gap-2.5 mt-2 flex-col">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-[var(--accent)] bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] rounded px-3 py-1">
                  <span>Replying to <strong>@{replyTo.author}</strong></span>
                  <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-500 hover:text-gray-700">×</button>
                </div>
              )}
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {meInitials}
                </div>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.author}…` : "Write a comment…"}
                  className="flex-1 rounded-full bg-[var(--bg-base)] dark:bg-[#252525] border border-[#C0C0C0] dark:border-[#3E3E3E] px-4 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button type="submit" disabled={submitting || !newComment.trim()}
                  className="rounded-full gradient-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:opacity-90">
                  Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showShareModal && <ShareModal post={currentPost} onClose={() => setShowShareModal(false)} onShared={onShared} />}
      {showEditModal && (
        <EditModal post={currentPost} onClose={() => setShowEditModal(false)} onSaved={(updated) => {
          setCurrentPost(updated);
          onUpdated?.(updated);
        }} />
      )}
    </>
  );
}
