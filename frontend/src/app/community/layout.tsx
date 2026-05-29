import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description: "Find Indian professionals, services, and events in Germany — all in one place.",
  openGraph: {
    title: "Community | Desiface",
    description: "Find Indian professionals, services, and events in Germany.",
    url: "https://desiface.com/community",
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
