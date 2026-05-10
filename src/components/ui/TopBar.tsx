"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Bell, Moon, Sun } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDrawer from "./NotificationDrawer";
import { useTheme } from "@/lib/theme-context";

export default function TopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const { darkMode, toggle } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Flame size={16} className="text-white" />
          </div>
          <span className="font-bold text-charcoal text-lg">KinSous</span>
          <span className="text-muted text-xs font-medium">· FolkProvidr</span>
        </div>

        <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="relative w-9 h-9 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center shadow-sm"
        >
          {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-charcoal" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open notifications"
          className="relative w-9 h-9 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center shadow-sm"
        >
          <Bell size={17} className="text-charcoal" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </motion.button>
        </div>
      </header>

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
