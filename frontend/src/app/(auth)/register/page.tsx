"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", username: "", password: "", full_name: "" });
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(form.email, form.username, form.password, form.full_name || undefined);
      router.push("/feed");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed. Please try again.");
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
            Join the community of Indians in Germany
          </h1>
        </div>

        {/* Register card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Make the most of your community</h2>
            <p className="text-sm text-gray-500 mb-5">Already on Desiface?{" "}
              <Link href="/login" className="font-semibold text-[#0A66C2] hover:underline">Sign in</Link>
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={update("full_name")}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={update("username")}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="priya_sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password (6+ characters)</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={update("password")}
                  className="w-full rounded border border-gray-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2]"
                  placeholder="••••••••"
                />
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                By clicking Agree &amp; Join, you agree that your data is stored in the EU and processed in accordance with the{" "}
                <span className="text-[#0A66C2] cursor-pointer hover:underline">GDPR</span>. We never sell your data.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#0A66C2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60 transition-colors"
              >
                {isLoading ? "Creating account…" : "Agree & Join"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
