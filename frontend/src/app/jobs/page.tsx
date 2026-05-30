"use client";

import { useEffect, useState } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  employment_type: string;
  description: string;
  requirements: string | null;
  is_remote: boolean;
  salary_range: string | null;
  apply_url: string | null;
  is_active: boolean;
  created_at: string;
  poster: { id: string; username: string; full_name: string | null; avatar_url: string | null; headline: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract",
  internship: "Internship", freelance: "Freelance",
};

const TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  part_time: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
  contract: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  internship: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  freelance: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function PostJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: (j: Job) => void }) {
  const TYPES = ["full_time", "part_time", "contract", "internship", "freelance"];
  const [form, setForm] = useState({
    title: "", company: "", location: "", employment_type: "full_time",
    description: "", requirements: "", is_remote: false, salary_range: "", apply_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      setError("Title, company and description are required.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<Job>("/jobs", {
        ...form,
        location: form.location || null,
        requirements: form.requirements || null,
        salary_range: form.salary_range || null,
        apply_url: form.apply_url || null,
      });
      onCreated(data);
      onClose();
    } catch { setError("Failed to post job. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDC] dark:border-[#2E2E2E] flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Post a Job</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-full text-lg">×</button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Job Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Company *</label>
                <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name"
                  className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location</label>
                <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Berlin, Germany"
                  className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select value={form.employment_type} onChange={(e) => set("employment_type", e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Salary Range</label>
                <input value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)} placeholder="e.g. €60k–€80k"
                  className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.is_remote} onChange={(e) => set("is_remote", e.target.checked)} className="rounded" />
              Remote / hybrid
            </label>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe the role…"
                className="w-full resize-none rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={3} placeholder="Skills and qualifications…"
                className="w-full resize-none rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Apply URL</label>
              <input value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://…"
                className="w-full rounded border border-gray-300 dark:border-[#3E3E3E] px-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
          </div>
          <div className="px-5 pb-4 flex justify-end gap-2 border-t border-[#E0DFDC] dark:border-[#2E2E2E] pt-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="rounded-full border border-gray-400 dark:border-gray-600 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2E2E2E]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{saving ? "Posting…" : "Post Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobCard({ job, onDeleted, currentUserId }: { job: Job; onDeleted: (id: string) => void; currentUserId: string | undefined }) {
  const isOwner = currentUserId === job.poster.id;
  const [deleting, setDeleting] = useState(false);

  async function deleteJob() {
    if (!confirm("Delete this job posting?")) return;
    setDeleting(true);
    try {
      await api.delete(`/jobs/${job.id}`);
      onDeleted(job.id);
    } finally { setDeleting(false); }
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[job.employment_type] ?? "bg-gray-100 text-gray-600"}`}>
              {TYPE_LABELS[job.employment_type] ?? job.employment_type}
            </span>
            {job.is_remote && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Remote</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
          <p className="text-sm font-medium text-[var(--accent)] mt-0.5">{job.company}</p>
          {(job.location || job.salary_range) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
              {job.location && <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {job.location}
              </span>}
              {job.salary_range && <span>💰 {job.salary_range}</span>}
            </p>
          )}
        </div>
        {isOwner && (
          <button onClick={deleteJob} disabled={deleting} className="text-gray-400 hover:text-red-400 transition-colors p-1 flex-shrink-0" title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{job.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{job.poster.full_name ?? job.poster.username}</span></span>
          <span>·</span>
          <span>{timeAgo(job.created_at)}</span>
        </div>
        {job.apply_url ? (
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
            className="rounded-full gradient-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
            Apply
          </a>
        ) : (
          <button className="rounded-full border border-[var(--accent)] text-[var(--accent)] px-4 py-1.5 text-xs font-semibold hover:bg-[var(--accent-light)] dark:hover:bg-[var(--accent-light-dark)] transition-colors">
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRemote, setFilterRemote] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("employment_type", filterType);
    if (filterRemote) params.set("is_remote", "true");
    api.get<Job[]>(`/jobs?${params}`)
      .then((r) => setJobs(r.data))
      .finally(() => setLoading(false));
  }, [filterType, filterRemote]);

  const TYPES = ["all", "full_time", "part_time", "contract", "internship", "freelance"];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[1080px] mx-auto px-4 py-6 flex gap-6">
        <div className="hidden lg:block w-[220px] flex-shrink-0">
          <LeftSidebar />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Jobs</h2>
            <button onClick={() => setShowModal(true)}
              className="rounded-full gradient-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              + Post a Job
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filterType === t ? "gradient-accent text-white" : "bg-white dark:bg-[#1c1c1c] border border-[#E0DFDC] dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)]"}`}>
                {t === "all" ? "All" : TYPE_LABELS[t]}
              </button>
            ))}
            <button onClick={() => setFilterRemote((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filterRemote ? "gradient-accent text-white" : "bg-white dark:bg-[#1c1c1c] border border-[#E0DFDC] dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)]"}`}>
              Remote only
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-5 animate-pulse h-40" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
              <p className="text-4xl mb-3">💼</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">No jobs posted yet.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to post an opportunity for the community.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} currentUserId={user?.id} onDeleted={(id) => setJobs((prev) => prev.filter((j) => j.id !== id))} />
              ))}
            </div>
          )}
        </div>
        <div className="hidden xl:block w-[300px] flex-shrink-0">
          <RightSidebar />
        </div>
      </div>
      {showModal && <PostJobModal onClose={() => setShowModal(false)} onCreated={(j) => setJobs((prev) => [j, ...prev])} />}
    </div>
  );
}
