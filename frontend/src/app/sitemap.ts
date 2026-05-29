import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://desiface.com";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/community`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
}
