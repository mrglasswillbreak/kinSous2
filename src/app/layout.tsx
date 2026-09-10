import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";
import { ThemeProvider } from "@/lib/theme-context";

export const dynamic = "force-dynamic";

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

const getMetadataBase = (): URL => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    try {
      const parsedUrl = new URL(siteUrl);
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return parsedUrl;
      }
    } catch {}
  }

  return new URL("https://kinsous.com");
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "KinSous · Cultural Culinary Marketplace",
  description:
    "FolkProvidr – Connect with local culinary helpers for authentic food experiences across Nigeria.",
  applicationName: "KinSous",
  manifest: "/site.webmanifest",
  keywords: ["Nigerian food", "culinary marketplace", "food delivery", "cooking help"],
  icons: {
    shortcut: [{ url: "/favicon.ico" }],
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#E67E22" }],
  },
  appleWebApp: {
    capable: true,
    title: "KinSous",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#E67E22",
    "msapplication-TileImage": "/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
  openGraph: {
    title: "KinSous · Cultural Culinary Marketplace",
    description: "FolkProvidr – Connect with local culinary helpers for authentic food experiences across Nigeria.",
    type: "website",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "KinSous · Cultural Culinary Marketplace",
    description: "FolkProvidr – Connect with local culinary helpers for authentic food experiences across Nigeria.",
    images: ["/android-chrome-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E67E22",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('kinsous-theme')||(localStorage.getItem('kinsous-dark')==='1'?'dark':localStorage.getItem('kinsous-dark')==='0'?'light':'system');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()" }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background antialiased`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
