import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Desiface",
    template: "%s | Desiface",
  },
  description: "The Indian community in Germany — connect with Indians living and working in Germany.",
  icons: { icon: "/logo.svg" },
  openGraph: {
    siteName: "Desiface",
    locale: "en_GB",
    type: "website",
    title: "Desiface",
    description: "The Indian community in Germany — connect with Indians living and working in Germany.",
    url: "https://desiface.com",
  },
  twitter: {
    card: "summary",
    title: "Desiface",
    description: "The Indian community in Germany",
  },
  metadataBase: new URL("https://desiface.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="pb-14 md:pb-0">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
