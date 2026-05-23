"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const AUTH_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <>
      {!isAuth && <TopBar />}
      <main className="min-h-screen bg-gradient-to-b from-background to-subtle pb-20 md:pb-0">{children}</main>
      {!isAuth && <BottomNav />}
    </>
  );
}
