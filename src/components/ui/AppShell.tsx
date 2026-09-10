"use client";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import { PwaProvider, PwaBanner } from "./PwaProvider";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = ["/login", "/recover", "/reset-password"].some((p) =>
    pathname.startsWith(p),
  );
  return (
    <MotionConfig reducedMotion="user">
      <PwaProvider>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {!isAuth && (
          <>
            <div className="hidden lg:block">
              <DesktopSidebar />
            </div>
            <div className="lg:hidden">
              <TopBar />
            </div>
          </>
        )}
        <main
          id="main-content"
          className={isAuth ? "min-h-dvh" : "min-h-dvh lg:pl-64"}
        >
          <PwaBanner />
          {children}
        </main>
        {!isAuth && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </PwaProvider>
    </MotionConfig>
  );
}
