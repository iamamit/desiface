"use client";

import { useEffect, useRef, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type FeedbackType = "feedback" | "bug";

export default function FeedbackButton() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!mounted || !user) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setScreenshot(f);
    setScreenshotPreview(URL.createObjectURL(f));
  }

  function reset() {
    setMessage("");
    setScreenshot(null);
    setScreenshotPreview(null);
    setType("feedback");
    setDone(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<{ id: string }>("/feedback", { type, message });
      if (screenshot) {
        const form = new FormData();
        form.append("file", screenshot);
        const { data: up } = await api.post<{ url: string }>("/feedback/screenshot", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await api.patch(`/feedback/${data.id}/screenshot`, { url: up.url });
      }
      setDone(true);
      setTimeout(() => { setOpen(false); reset(); }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-20 right-4 md:bottom-6 z-30 flex items-center gap-2 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl w-full max-w-md p-5">
            {done ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Thanks for your feedback!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We'll look into it shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share feedback</h2>
                  <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Type toggle */}
                <div className="flex gap-2 mb-4">
                  {(["feedback", "bug"] as FeedbackType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        type === t
                          ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                          : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-[var(--accent)]"
                      }`}
                    >
                      {t === "feedback" ? "General feedback" : "Report a bug"}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === "bug" ? "Describe the issue — what happened and what you expected…" : "Tell us what you think, what's working, what's missing…"}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  required
                />

                {/* Screenshot */}
                <div className="mt-3">
                  {screenshotPreview ? (
                    <div className="relative inline-block">
                      <img src={screenshotPreview} alt="screenshot" className="h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                      <button
                        type="button"
                        onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[var(--accent)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Attach screenshot (optional)
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="mt-4 w-full gradient-accent text-white text-sm font-semibold py-2.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {submitting ? "Sending…" : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
