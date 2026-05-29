import type { Metadata } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const res = await fetch(`${backendUrl}/users/${username}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: "Profile not found" };
    const user = await res.json();
    const name = user.full_name || user.username;
    const description = user.bio || `${name}'s profile on Desiface — the Indian community in Germany.`;
    return {
      title: name,
      description,
      openGraph: {
        title: `${name} | Desiface`,
        description,
        url: `https://desiface.com/profile/${username}`,
        images: user.avatar_url ? [{ url: user.avatar_url, width: 200, height: 200, alt: name }] : [],
      },
      twitter: {
        card: user.avatar_url ? "summary" : "summary",
        title: `${name} | Desiface`,
        description,
        images: user.avatar_url ? [user.avatar_url] : [],
      },
    };
  } catch {
    return { title: "Profile" };
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
