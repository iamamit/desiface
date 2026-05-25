"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { fetchMe } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No token provided."); return; }
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async () => {
        await fetchMe();
        setStatus("success");
        setTimeout(() => router.push("/feed"), 2000);
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail ?? "Invalid or expired verification link.";
        setStatus("error");
        setMessage(detail);
      });
  }, [token]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <div className="w-8 h-8 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto" />
      )}
      {status === "success" && (
        <>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800">Email verified! Redirecting…</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-sm text-red-500 mb-3">{message}</p>
          <Link href="/login" className="text-sm text-[#0A66C2] hover:underline">Back to sign in</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="w-10 h-10 rounded bg-[#0A66C2] flex items-center justify-center mb-6">
          <span className="text-white font-extrabold text-base italic tracking-tight">df</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Verifying your email…</h1>
        <Suspense fallback={<div className="w-8 h-8 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
