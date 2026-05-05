"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Scroll, Map, User, Video, Users } from "lucide-react";

const navItems = [
  { href: "/", icon: Flame, label: "Home" },
  { href: "/bounties", icon: Scroll, label: "Bounties" },
  { href: "/helpers", icon: Users, label: "Helpers" },
  { href: "/tracker", icon: Map, label: "Track" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
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
