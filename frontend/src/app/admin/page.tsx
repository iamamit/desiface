"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Metrics {
  users: { total: number; new_today: number; new_this_week: number; active_last_7d: number };
  posts: { total: number; new_today: number; new_this_week: number };
  comments: { total: number; new_today: number };
  likes: { total: number };
  messages: { total: number; new_today: number };
  connections: { total: number };
  groups: { total: number; members_total: number };
  jobs: { total: number };
  errors: { today_total: number; today_4xx: number; today_5xx: number };
}

interface ErrorItem {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  detail: string | null;
  user_id: string | null;
  ip_address: string | null;
  query_params: string | null;
}

interface ErrorLog {
  total: number;
  items: ErrorItem[];
}

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ code }: { code: number }) {
  const color = code >= 500 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : code >= 400 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-green-100 text-green-700";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${color}`}>{code}</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [errors, setErrors] = useState<ErrorLog | null>(null);
  const [filterCode, setFilterCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [tab, setTab] = useState<"overview" | "errors" | "users" | "feedback">("overview");

  const [adminUsers, setAdminUsers] = useState<{ total: number; items: { id: string; email: string; username: string; full_name: string | null; is_admin: boolean; is_active: boolean; created_at: string }[] } | null>(null);

  const [feedbackItems, setFeedbackItems] = useState<{ total: number; items: { id: string; type: string; message: string; screenshot_url: string | null; is_resolved: boolean; created_at: string; user_username: string; user_full_name: string | null }[] } | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "feedback" | "bug" | "open">("open");

  useEffect(() => {
    if (user && !user.is_admin) {
      router.replace("/feed");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([
      api.get<Metrics>("/admin/metrics"),
      api.get<ErrorLog>("/admin/errors?limit=100"),
    ]).then(([m, e]) => {
      setMetrics(m.data);
      setErrors(e.data);
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (tab === "users" && !adminUsers && user?.is_admin) {
      api.get("/admin/users?limit=100").then((r) => setAdminUsers(r.data));
    }
  }, [tab, adminUsers, user]);

  useEffect(() => {
    if (tab === "feedback" && user?.is_admin) {
      loadFeedback(feedbackFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, feedbackFilter, user]);

  async function loadFeedback(filter: typeof feedbackFilter) {
    let url = "/feedback?limit=100";
    if (filter === "bug") url += "&type=bug";
    if (filter === "feedback") url += "&type=feedback";
    if (filter === "open") url += "&is_resolved=false";
    const r = await api.get(url);
    setFeedbackItems(r.data);
  }

  async function toggleResolve(id: string, current: boolean) {
    await api.patch(`/feedback/${id}/resolve`);
    setFeedbackItems((prev) => prev ? {
      ...prev,
      items: prev.items.map((f) => f.id === id ? { ...f, is_resolved: !current } : f),
    } : prev);
  }

  async function loadErrors(code?: string) {
    const url = code ? `/admin/errors?limit=100&status_code=${code}` : "/admin/errors?limit=100";
    const r = await api.get<ErrorLog>(url);
    setErrors(r.data);
  }

  async function clearErrors() {
    if (!confirm("Clear all error logs?")) return;
    setClearing(true);
    await api.delete("/admin/errors");
    setErrors({ total: 0, items: [] });
    setMetrics((m) => m ? { ...m, errors: { today_total: 0, today_4xx: 0, today_5xx: 0 } } : m);
    setClearing(false);
  }

  async function toggleAdmin(userId: string, current: boolean) {
    await api.patch(`/admin/users/${userId}/role`, { is_admin: !current });
    setAdminUsers((prev) => prev ? {
      ...prev,
      items: prev.items.map((u) => u.id === userId ? { ...u, is_admin: !current } : u),
    } : prev);
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dark:bg-[#111111]">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <button onClick={() => { setLoading(true); Promise.all([api.get<Metrics>("/admin/metrics"), api.get<ErrorLog>("/admin/errors?limit=100")]).then(([m, e]) => { setMetrics(m.data); setErrors(e.data); }).finally(() => setLoading(false)); }}
            className="text-xs text-[var(--accent)] hover:underline">
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#E0DFDC] dark:border-[#2E2E2E]">
          {(["overview", "errors", "users", "feedback"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {t}
              {t === "errors" && errors && errors.total > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{errors.total}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && metrics && (
              <div className="space-y-5">
                {/* Error summary bar */}
                {(metrics.errors.today_5xx > 0 || metrics.errors.today_4xx > 0) && (
                  <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${metrics.errors.today_5xx > 0 ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800" : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"}`}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${metrics.errors.today_5xx > 0 ? "text-red-500" : "text-amber-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {metrics.errors.today_5xx > 0 && <span className="text-red-600 dark:text-red-400">{metrics.errors.today_5xx} server errors</span>}
                      {metrics.errors.today_5xx > 0 && metrics.errors.today_4xx > 0 && " and "}
                      {metrics.errors.today_4xx > 0 && <span className="text-amber-600 dark:text-amber-400">{metrics.errors.today_4xx} client errors</span>}
                      {" today — "}
                      <button onClick={() => setTab("errors")} className="underline">view error log</button>
                    </p>
                  </div>
                )}

                <div>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Users</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard label="Total Users" value={metrics.users.total} />
                    <KpiCard label="New Today" value={metrics.users.new_today} />
                    <KpiCard label="New This Week" value={metrics.users.new_this_week} />
                    <KpiCard label="Active Last 7d" value={metrics.users.active_last_7d} sub="posted, liked, or messaged" />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard label="Total Posts" value={metrics.posts.total} sub={`+${metrics.posts.new_today} today`} />
                    <KpiCard label="Comments" value={metrics.comments.total} sub={`+${metrics.comments.new_today} today`} />
                    <KpiCard label="Likes" value={metrics.likes.total} />
                    <KpiCard label="Messages" value={metrics.messages.total} sub={`+${metrics.messages.new_today} today`} />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Community</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard label="Connections" value={metrics.connections.total} />
                    <KpiCard label="Groups" value={metrics.groups.total} sub={`${metrics.groups.members_total} memberships`} />
                    <KpiCard label="Jobs Posted" value={metrics.jobs.total} />
                    <KpiCard label="Errors Today" value={metrics.errors.today_total} sub={`${metrics.errors.today_5xx} server / ${metrics.errors.today_4xx} client`} />
                  </div>
                </div>
              </div>
            )}

            {/* ERRORS */}
            {tab === "errors" && errors && (
              <div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{errors.total} total errors logged</p>
                  <div className="flex gap-2 ml-auto flex-wrap">
                    {["", "400", "401", "403", "404", "422", "429", "500", "502"].map((code) => (
                      <button key={code} onClick={() => { setFilterCode(code); loadErrors(code || undefined); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCode === code ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-gray-300 dark:border-[#3E3E3E] text-gray-600 dark:text-gray-400 hover:border-[var(--accent)]"}`}>
                        {code || "All"}
                      </button>
                    ))}
                    <button onClick={clearErrors} disabled={clearing}
                      className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                      {clearing ? "Clearing…" : "Clear all"}
                    </button>
                  </div>
                </div>

                {errors.items.length === 0 ? (
                  <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No errors logged.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E0DFDC] dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#242424]">
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Time</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Method</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Path</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Detail</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {errors.items.map((e) => (
                            <tr key={e.id} className="border-b border-[#E0DFDC] dark:border-[#2E2E2E] hover:bg-gray-50 dark:hover:bg-[#242424]">
                              <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                                {new Date(e.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <StatusBadge code={e.status_code} />
                              </td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {e.method}
                              </td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 max-w-[200px] truncate" title={e.path + (e.query_params ? `?${e.query_params}` : "")}>
                                {e.path}{e.query_params ? `?${e.query_params}` : ""}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-[250px] truncate" title={e.detail ?? ""}>
                                {e.detail ?? "—"}
                              </td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {e.ip_address ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div>
                {!adminUsers ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 animate-pulse h-12" />)}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{adminUsers.total} users total</p>
                    <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#E0DFDC] dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#242424]">
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">User</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Email</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Joined</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Role</th>
                              <th className="px-4 py-2" />
                            </tr>
                          </thead>
                          <tbody>
                            {adminUsers.items.map((u) => (
                              <tr key={u.id} className="border-b border-[#E0DFDC] dark:border-[#2E2E2E] hover:bg-gray-50 dark:hover:bg-[#242424]">
                                <td className="px-4 py-2">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{u.full_name ?? u.username}</p>
                                  <p className="text-xs text-gray-400">@{u.username}</p>
                                </td>
                                <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">{u.email}</td>
                                <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                  {u.is_admin ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] text-[var(--accent)] text-xs font-semibold">Admin</span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2E2E2E] text-gray-500 dark:text-gray-400 text-xs">Member</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {u.id !== user?.id && (
                                    <button onClick={() => toggleAdmin(u.id, u.is_admin)}
                                      className="text-xs text-[var(--accent)] hover:underline">
                                      {u.is_admin ? "Revoke admin" : "Make admin"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* FEEDBACK */}
            {tab === "feedback" && (
              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {(["open", "all", "feedback", "bug"] as const).map((f) => (
                    <button key={f} onClick={() => setFeedbackFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${feedbackFilter === f ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-gray-300 dark:border-[#3E3E3E] text-gray-600 dark:text-gray-400 hover:border-[var(--accent)]"}`}>
                      {f === "open" ? "Open" : f === "all" ? "All" : f === "feedback" ? "Feedback" : "Bugs"}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{feedbackItems?.total ?? 0} items</span>
                </div>

                {!feedbackItems ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-4 animate-pulse h-20" />)}</div>
                ) : feedbackItems.items.length === 0 ? (
                  <div className="bg-white dark:bg-[#1c1c1c] rounded-lg border border-[#E0DFDC] dark:border-[#2E2E2E] p-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No feedback yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackItems.items.map((fb) => (
                      <div key={fb.id} className={`bg-white dark:bg-[#1c1c1c] rounded-lg border ${fb.is_resolved ? "border-[#E0DFDC] dark:border-[#2E2E2E] opacity-60" : "border-[#E0DFDC] dark:border-[#2E2E2E]"} p-4`}>
                        <div className="flex items-start gap-3">
                          <span className={`flex-shrink-0 inline-block px-2 py-0.5 rounded text-xs font-semibold ${fb.type === "bug" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                            {fb.type === "bug" ? "Bug" : "Feedback"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{fb.user_full_name ?? fb.user_username}</span>
                              {" · @"}{fb.user_username}
                              {" · "}{new Date(fb.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{fb.message}</p>
                            {fb.screenshot_url && (
                              <a href={fb.screenshot_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                                <img src={fb.screenshot_url} alt="screenshot" className="max-h-40 rounded-lg border border-gray-200 dark:border-gray-600 object-contain" />
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => toggleResolve(fb.id, fb.is_resolved)}
                            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${fb.is_resolved ? "border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[var(--accent)] hover:text-[var(--accent)]" : "border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                          >
                            {fb.is_resolved ? "Reopen" : "Resolve"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
