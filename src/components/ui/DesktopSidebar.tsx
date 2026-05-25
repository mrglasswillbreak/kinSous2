"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  CreditCard,
  Flame,
  Home,
  LogOut,
  Map,
  MessageCircle,
  Moon,
  Scroll,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/lib/theme-context";
import NotificationDrawer from "./NotificationDrawer";

const navItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: "messages";
}> = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/bounties", icon: Scroll, label: "Bounties" },
  { href: "/helpers", icon: Users, label: "Helpers" },
  { href: "/contacts", icon: MessageCircle, label: "Contacts", badge: "messages" },
  { href: "/tracker", icon: Map, label: "Tracker" },
  { href: "/payment", icon: CreditCard, label: "Payments" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const { totalUnread } = useConversations();
  const { user } = useCurrentUser();
  const { darkMode, toggle } = useTheme();

  const avatarUrl =
    user?.avatarUrl ||
    `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.userId ?? "kinsous")}`;
  const displayName = user?.name ?? "KinSous member";
  const displayContact = user?.email ?? user?.phone ?? "Profile";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Close notification drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Sidebar — visible only on lg+ */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 z-40 flex-col border-r border-card-border bg-[var(--nav-bg)] backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-card-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-primary">
            <Flame size={18} className="text-white" />
          </div>
          <div>
            <span className="block text-base font-bold leading-tight text-charcoal">KinSous</span>
            <span className="block text-[11px] font-medium leading-tight text-muted">FolkProvidr</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            const showBadge = badge === "messages" && totalUnread > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-primary-50 text-primary dark:bg-primary-900/20"
                    : "text-charcoal hover:bg-subtle"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-primary" : "text-muted group-hover:text-charcoal transition-colors"}
                />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <motion.span
                    key={totalUnread}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white"
                  >
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </motion.span>
                )}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-dot"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions row */}
        <div className="border-t border-card-border px-3 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-badge text-charcoal hover:bg-subtle transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-badge text-charcoal hover:bg-subtle transition-colors"
          >
            {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} />}
          </button>

          <div className="flex-1" />

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={17} />
          </motion.button>
        </div>

        {/* User profile footer */}
        <Link
          href="/profile"
          className="flex items-center gap-3 border-t border-card-border px-4 py-3.5 hover:bg-subtle transition-colors"
        >
          <Image
            src={avatarUrl}
            alt={displayName}
            width={36}
            height={36}
            unoptimized={avatarUrl.startsWith("data:")}
            className="h-9 w-9 flex-shrink-0 rounded-xl object-cover ring-2 ring-primary-100"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-charcoal">{displayName}</p>
            <p className="truncate text-xs text-muted">{displayContact}</p>
          </div>
        </Link>
      </aside>

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
