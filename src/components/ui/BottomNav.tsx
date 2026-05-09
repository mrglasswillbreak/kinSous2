"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Scroll, MessageCircle, Users, User } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";

const navItems = [
  { href: "/", icon: Flame, label: "Home" },
  { href: "/bounties", icon: Scroll, label: "Bounties" },
  { href: "/messages", icon: MessageCircle, label: "Messages", badge: true },
  { href: "/helpers", icon: Users, label: "Helpers" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnread } = useConversations();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-t border-card-border">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2 pb-safe">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/") && href !== "/";
          const showBadge = badge && totalUnread > 0;
          return (
            <Link key={href} href={href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-colors ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                  {showBadge && !active && (
                    <motion.div
                      key={totalUnread}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5"
                    >
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </motion.div>
                  )}
                </div>
                <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
