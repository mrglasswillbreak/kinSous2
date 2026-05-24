"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

const AUTH_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return (
    <>
      {!isAuth && isDesktop === true && <DesktopSidebar />}
      {!isAuth && isDesktop === false && <TopBar />}
      <main className={`min-h-screen${!isAuth && isDesktop === true ? " lg:pl-64" : ""}`}>
        {children}
      </main>
      {!isAuth && isDesktop === false && <BottomNav />}
    </>
  );
}
