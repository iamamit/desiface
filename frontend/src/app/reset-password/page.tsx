"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import api from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Invalid or expired link. Please request a new one.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-500">
        Invalid reset link. <Link href="/forgot-password" className="text-[#0A66C2] hover:underline">Request a new one</Link>.
      </p>
    );
  }

  return success ? (
    <div className="text-center">
      <p className="text-green-600 font-medium text-sm">Password reset! Redirecting to login…</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rp-new" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input id="rp-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          required minLength={8} className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]" />
      </div>
      <div>
        <label htmlFor="rp-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <input id="rp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          required className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full rounded-full bg-[#0A66C2] py-2.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50 transition-colors">
        {submitting ? "Resetting…" : "Reset password"}
      </button>
      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-[#0A66C2] hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="w-10 h-10 rounded bg-[#0A66C2] flex items-center justify-center mb-6">
          <span className="text-white font-extrabold text-base italic tracking-tight">df</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Set new password</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account.</p>
        <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
