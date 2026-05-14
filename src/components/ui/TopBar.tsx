"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CreditCard,
  Flame,
  Home,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Moon,
  Scroll,
  Settings,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/lib/theme-context";
import NotificationDrawer from "./NotificationDrawer";

const menuItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: "messages";
}> = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/bounties", icon: Scroll, label: "Bounties" },
  { href: "/helpers", icon: Users, label: "Helpers" },
  { href: "/messages", icon: MessageCircle, label: "Messages", badge: "messages" },
  { href: "/tracker", icon: Map, label: "Tracker" },
  { href: "/payment", icon: CreditCard, label: "Payments" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } =
    useNotifications();
  const { totalUnread } = useConversations();
  const { user } = useCurrentUser();
  const { darkMode, toggle } = useTheme();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const avatarUrl =
    user?.avatarUrl ||
    `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.userId ?? "kinsous")}`;
  const displayName = user?.name ?? "KinSous member";
  const displayContact = user?.email ?? user?.phone ?? "Profile";

  const openNotifications = () => {
    setMenuOpen(false);
    setDrawerOpen(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-card-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Flame size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold leading-tight text-charcoal">
                KinSous
              </span>
              <span className="block truncate text-[11px] font-medium leading-tight text-muted">
                FolkProvidr
              </span>
            </div>
          </Link>

          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card shadow-sm"
          >
            <Menu size={20} className="text-charcoal" />
            {(unreadCount > 0 || totalUnread > 0) && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
            )}
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.aside
              key="menu-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-[min(360px,calc(100vw-28px))] flex-col border-l border-card-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
                <p className="text-sm font-bold text-charcoal">Menu</p>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-badge text-charcoal"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="border-b border-card-border px-4 py-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl bg-subtle p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-primary-100"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-charcoal">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted">{displayContact}</p>
                  </div>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-card-border p-4">
                <button
                  type="button"
                  onClick={openNotifications}
                  className="flex min-h-[76px] flex-col items-start justify-between rounded-2xl border border-card-border bg-input-surface p-3 text-left transition hover:bg-subtle"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-badge">
                    <Bell size={17} className="text-charcoal" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-charcoal">
                    Notifications
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggle}
                  className="flex min-h-[76px] flex-col items-start justify-between rounded-2xl border border-card-border bg-input-surface p-3 text-left transition hover:bg-subtle"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-badge">
                    {darkMode ? (
                      <Sun size={17} className="text-yellow-400" />
                    ) : (
                      <Moon size={17} className="text-charcoal" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-charcoal">
                    {darkMode ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3">
                {menuItems.map(({ href, icon: Icon, label, badge }) => {
                  const active =
                    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
                  const showMessageBadge = badge === "messages" && totalUnread > 0;

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-primary-50 text-primary dark:bg-primary-900/20"
                          : "text-charcoal hover:bg-subtle"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex-1">{label}</span>
                      {showMessageBadge && (
                        <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {totalUnread > 9 ? "9+" : totalUnread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-card-border p-4 pb-safe">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20"
                >
                  <LogOut size={17} />
                  Log out
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onRead={markRead}
        onMarkAllRead={markAllRead}
        onDismiss={dismiss}
      />
    </>
  );
}
