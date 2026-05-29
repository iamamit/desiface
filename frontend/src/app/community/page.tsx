"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Program, Service, ServiceCategory, ProgramCategory } from "@/types/community";

// ── Category metadata ────────────────────────────────────────────────────────

const SERVICE_CATS: { value: ServiceCategory | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  { value: "visa", label: "Visa / Immigration", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  { value: "legal", label: "Legal", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  { value: "finance", label: "Finance", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  { value: "tax", label: "Tax", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  { value: "career", label: "Career", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  { value: "teaching", label: "Teaching", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" },
  { value: "language", label: "Language", color: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300" },
  { value: "housing", label: "Housing", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  { value: "tech", label: "Tech Help", color: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300" },
  { value: "other", label: "Other", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
];

const PROGRAM_CATS: { value: ProgramCategory | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  { value: "workshop", label: "Workshop", color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" },
  { value: "meetup", label: "Meetup", color: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300" },
  { value: "study_group", label: "Study Group", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  { value: "networking", label: "Networking", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  { value: "cultural", label: "Cultural", color: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" },
  { value: "language", label: "Language Exchange", color: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300" },
  { value: "webinar", label: "Webinar", color: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" },
  { value: "other", label: "Other", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
];

function serviceCatColor(cat: string) {
  return SERVICE_CATS.find((c) => c.value === cat)?.color ?? "bg-gray-100 text-gray-600";
}
function serviceCatLabel(cat: string) {
  return SERVICE_CATS.find((c) => c.value === cat)?.label ?? cat;
}
function programCatColor(cat: string) {
  return PROGRAM_CATS.find((c) => c.value === cat)?.color ?? "bg-gray-100 text-gray-600";
}
function programCatLabel(cat: string) {
  return PROGRAM_CATS.find((c) => c.value === cat)?.label ?? cat;
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ svc, onDelete, currentUserId }: { svc: Service; onDelete: (id: string) => void; currentUserId: string }) {
  const isOwner = svc.provider.id === currentUserId;
  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${serviceCatColor(svc.category)}`}>
          {serviceCatLabel(svc.category)}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.is_paid ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
            {svc.is_paid ? (svc.price_info ?? "Paid") : "Free"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium capitalize">
            {svc.mode === "in_person" ? "In-person" : svc.mode === "both" ? "Remote & In-person" : "Remote"}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug">{svc.title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{svc.description}</p>

      {svc.location && (
        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {svc.location}
        </p>
      )}

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#E0DFDC] dark:border-[#2E2E2E]">
        <Link href={`/profile/${svc.provider.username}`} className="flex items-center gap-2 hover:opacity-80">
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(svc.provider.full_name ?? svc.provider.username).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{svc.provider.full_name ?? svc.provider.username}</p>
            {svc.provider.headline && <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate max-w-[140px]">{svc.provider.headline}</p>}
          </div>
        </Link>
        {isOwner ? (
          <button onClick={() => onDelete(svc.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
        ) : (
          <Link href={`/messages/${svc.provider.username}`} className="text-xs font-semibold text-[var(--accent)] border border-[var(--accent)] px-3 py-1 rounded-full hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
            Message
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Program card ─────────────────────────────────────────────────────────────

function ProgramCard({ prog, onRsvp, onDelete, currentUserId }: {
  prog: Program;
  onRsvp: (id: string, rsvped: boolean) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}) {
  const isOwner = prog.organizer.id === currentUserId;
  const isFull = prog.capacity !== null && prog.rsvp_count >= prog.capacity;
  const isPast = new Date(prog.event_date) < new Date();

  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${programCatColor(prog.category)}`}>
          {programCatLabel(prog.category)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${prog.is_free ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"}`}>
          {prog.is_free ? "Free" : (prog.price_info ?? "Paid")}
        </span>
      </div>

      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug">{prog.title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{prog.description}</p>

      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatEventDate(prog.event_date)}
        </span>
        <span className="flex items-center gap-1">
          {prog.is_online ? (
            <><svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Online</>
          ) : (
            <><svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>{prog.location}</>
          )}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {prog.rsvp_count} going {prog.capacity ? `· ${prog.capacity - prog.rsvp_count} spots left` : ""}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#E0DFDC] dark:border-[#2E2E2E]">
        <Link href={`/profile/${prog.organizer.username}`} className="flex items-center gap-2 hover:opacity-80">
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(prog.organizer.full_name ?? prog.organizer.username).slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{prog.organizer.full_name ?? prog.organizer.username}</p>
        </Link>
        {isOwner ? (
          <button onClick={() => onDelete(prog.id)} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
        ) : isPast ? (
          <span className="text-xs text-gray-400">Past event</span>
        ) : (
          <button
            disabled={isFull && !prog.rsvped_by_me}
            onClick={() => onRsvp(prog.id, prog.rsvped_by_me)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors border ${
              prog.rsvped_by_me
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : isFull
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)]"
            }`}
          >
            {prog.rsvped_by_me ? "Going ✓" : isFull ? "Full" : "RSVP"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Offer Service modal ───────────────────────────────────────────────────────

function OfferServiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (svc: Service) => void }) {
  const [form, setForm] = useState({ category: "visa", title: "", description: "", is_paid: false, price_info: "", mode: "remote", location: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await api.post<Service>("/services", {
        ...form,
        price_info: form.is_paid ? form.price_info || null : null,
        location: form.mode !== "remote" ? form.location || null : null,
      });
      onCreated(r.data);
      onClose();
    } catch {
      setError("Failed to create service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
          <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">Offer a Service</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100">
              {SERVICE_CATS.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="e.g. Help with Blue Card application" className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe what you offer and how you can help..." className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 resize-none" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100">
                <option value="remote">Remote</option>
                <option value="in_person">In-person</option>
                <option value="both">Remote & In-person</option>
              </select>
            </div>
            {form.mode !== "remote" && (
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">City</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Munich" className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">This is a paid service</span>
            </label>
            {form.is_paid && (
              <input value={form.price_info} onChange={(e) => setForm({ ...form, price_info: e.target.value })} placeholder="e.g. €50/hour" className="flex-1 border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] text-white rounded-full py-2 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Publishing…" : "Publish Service"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Create Program modal ──────────────────────────────────────────────────────

function CreateProgramModal({ onClose, onCreated }: { onClose: () => void; onCreated: (prog: Program) => void }) {
  const [form, setForm] = useState({
    category: "meetup", title: "", description: "",
    event_date: "", is_online: true, location: "",
    capacity: "", is_free: true, price_info: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await api.post<Program>("/programs", {
        category: form.category,
        title: form.title,
        description: form.description,
        event_date: new Date(form.event_date).toISOString(),
        is_online: form.is_online,
        location: !form.is_online ? form.location || null : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        is_free: form.is_free,
        price_info: !form.is_free ? form.price_info || null : null,
      });
      onCreated(r.data);
      onClose();
    } catch {
      setError("Failed to create program.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E] sticky top-0 bg-white dark:bg-[#1c1c1c] z-10">
          <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">Create a Program</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100">
              {PROGRAM_CATS.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="e.g. Berlin Indians Networking Night" className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What's happening? Who should attend?" className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Date & Time</label>
            <input required type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_online} onChange={(e) => setForm({ ...form, is_online: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Online event</span>
            </label>
            {!form.is_online && (
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location / address" className="flex-1 border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Capacity (optional)</label>
              <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Leave blank for unlimited" className="w-full border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!form.is_free} onChange={(e) => setForm({ ...form, is_free: !e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Paid event</span>
            </label>
            {!form.is_free && (
              <input value={form.price_info} onChange={(e) => setForm({ ...form, price_info: e.target.value })} placeholder="e.g. €10" className="flex-1 border border-gray-300 dark:border-[#3E3E3E] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100" />
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] text-white rounded-full py-2 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Creating…" : "Create Program"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"services" | "programs">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [serviceCat, setServiceCat] = useState<string>("all");
  const [programCat, setProgramCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Service[]>("/services"),
      api.get<Program[]>("/programs"),
    ]).then(([s, p]) => {
      setServices(s.data);
      setPrograms(p.data);
    }).finally(() => setLoading(false));
  }, []);

  async function handleDeleteService(id: string) {
    await api.delete(`/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRsvp(id: string, rsvped: boolean) {
    if (rsvped) {
      await api.delete(`/programs/${id}/rsvp`);
    } else {
      await api.post(`/programs/${id}/rsvp`, {});
    }
    const r = await api.get<Program[]>("/programs");
    setPrograms(r.data);
  }

  async function handleDeleteProgram(id: string) {
    await api.delete(`/programs/${id}`);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  const filteredServices = serviceCat === "all" ? services : services.filter((s) => s.category === serviceCat);
  const filteredPrograms = programCat === "all" ? programs : programs.filter((p) => p.category === programCat);

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111] pt-4 pb-16">
        <div className="max-w-[1080px] mx-auto px-4 flex gap-5">
          <aside className="w-[220px] flex-shrink-0 hidden md:block">
            <LeftSidebar />
          </aside>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">Community</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Services and programs from your network</p>
                </div>
                <button
                  onClick={() => tab === "services" ? setShowOfferModal(true) : setShowProgramModal(true)}
                  className="bg-[var(--accent)] text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  {tab === "services" ? "+ Offer a Service" : "+ Create a Program"}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 mt-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
                {(["services", "programs"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
                      tab === t
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(tab === "services" ? SERVICE_CATS : PROGRAM_CATS).map((c) => (
                <button
                  key={c.value}
                  onClick={() => tab === "services" ? setServiceCat(c.value) : setProgramCat(c.value)}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all border ${
                    (tab === "services" ? serviceCat : programCat) === c.value
                      ? `${c.color} border-transparent ring-2 ring-offset-1 ring-[var(--accent)]`
                      : `${c.color} border-transparent opacity-70 hover:opacity-100`
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Content grid */}
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
            ) : tab === "services" ? (
              filteredServices.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No services yet. Be the first to offer one!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredServices.map((svc) => (
                    <ServiceCard key={svc.id} svc={svc} onDelete={handleDeleteService} currentUserId={user.id} />
                  ))}
                </div>
              )
            ) : (
              filteredPrograms.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No programs yet. Create the first one!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPrograms.map((prog) => (
                    <ProgramCard key={prog.id} prog={prog} onRsvp={handleRsvp} onDelete={handleDeleteProgram} currentUserId={user.id} />
                  ))}
                </div>
              )
            )}
          </div>

          <aside className="w-[300px] flex-shrink-0 hidden lg:block">
            <RightSidebar />
          </aside>
        </div>
      </main>

      {showOfferModal && (
        <OfferServiceModal
          onClose={() => setShowOfferModal(false)}
          onCreated={(svc) => setServices((prev) => [svc, ...prev])}
        />
      )}
      {showProgramModal && (
        <CreateProgramModal
          onClose={() => setShowProgramModal(false)}
          onCreated={(prog) => setPrograms((prev) => [prog, ...prev])}
        />
      )}
    </>
  );
}
