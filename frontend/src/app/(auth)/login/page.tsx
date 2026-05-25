"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/feed");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="w-10 h-10 rounded bg-[#0A66C2] flex items-center justify-center">
          <span className="text-white font-extrabold text-base italic">df</span>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-start max-w-[1080px] mx-auto w-full px-6 pt-8 gap-20">
        {/* Left copy */}
        <div className="hidden lg:flex flex-col pt-12 max-w-sm">
          <h1 className="text-4xl font-light text-[#0A66C2] leading-tight">
            Welcome to your professional community
          </h1>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-5">Sign in</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#0A66C2] hover:underline">Forgot password?</Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#0A66C2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60 transition-colors"
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-500">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              New to Desiface?{" "}
              <Link href="/register" className="font-semibold text-[#0A66C2] hover:underline">
                Join now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
