"use client";

import { useState, useCallback } from "react";

export type NotificationType =
  | "NEW_BID"
  | "BID_ACCEPTED"
  | "PAYMENT_ESCROWED"
  | "DELIVERY_UPDATE"
  | "NEW_MESSAGE"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  avatarUrl?: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1", type: "NEW_BID", title: "New bid on your bounty",
    body: "Amara Okafor bid ₦4,500 on 'Need fresh ingredients for Egusi Soup'",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    href: "/bounties", read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "n-2", type: "PAYMENT_ESCROWED", title: "Payment escrowed",
    body: "₦6,000 is now safely held in escrow for your order.",
    href: "/payment", read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "n-3", type: "DELIVERY_UPDATE", title: "Helper is on the way!",
    body: "Marcus DeLeon picked up your items and is heading your way (~12 min).",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    href: "/tracker", read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n-4", type: "NEW_MESSAGE", title: "Message from Amara",
    body: "\"I found the ugu leaves – they look very fresh today!\"",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    href: "/messages", read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "n-5", type: "BID_ACCEPTED", title: "Your bid was accepted!",
    body: "Chioma Nwosu accepted your bid. Session starts soon.",
    href: "/bounties", read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, dismiss };
}
