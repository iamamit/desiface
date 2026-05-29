import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Browse job opportunities in Germany for Indian professionals.",
  openGraph: {
    title: "Jobs | Desiface",
    description: "Browse job opportunities in Germany for Indian professionals.",
    url: "https://desiface.com/jobs",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
