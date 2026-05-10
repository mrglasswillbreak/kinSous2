"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth");

  return (
    <>
      {!isAuth && <TopBar />}
      <main className="min-h-screen">{children}</main>
      {!isAuth && <BottomNav />}
    </>
  );
}
