import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/ui/BottomNav";
import TopBar from "@/components/ui/TopBar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "KinSous · Cultural Culinary Marketplace",
  description:
    "FolkProvidr – Connect with local culinary helpers for authentic food experiences across Nigeria and the US.",
  keywords: ["Nigerian food", "culinary marketplace", "food delivery", "cooking help"],
  openGraph: {
    title: "KinSous",
    description: "Cultural Culinary Social Marketplace",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E67E22",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background antialiased`}>
        <TopBar />
        <main className="min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
