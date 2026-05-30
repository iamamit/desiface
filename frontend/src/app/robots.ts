import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/community", "/jobs"],
        disallow: ["/api/", "/admin/", "/feed", "/messages/", "/notifications/", "/connections/", "/settings/", "/saved/"],
      },
    ],
    sitemap: "https://desiface.com/sitemap.xml",
  };
}
