"use client";

import Link from "next/link";
import { useState } from "react";

import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="w-10 h-10 rounded bg-[#0A66C2] flex items-center justify-center mb-6">
          <span className="text-white font-extrabold text-base italic tracking-tight">df</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium">Check your email</p>
            <p className="text-xs text-gray-500 mt-1">If <strong>{email}</strong> is registered, a reset link has been sent.</p>
            <Link href="/login" className="mt-4 block text-sm text-[#0A66C2] hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#0A66C2] py-2.5 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-[#0A66C2] hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
