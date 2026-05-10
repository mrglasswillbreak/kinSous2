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
      <main className="min-h-screen">{children}</main>
      {!isAuth && <BottomNav />}
    </>
  );
}
