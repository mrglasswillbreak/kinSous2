"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, BellOff, Package, DollarSign, Truck, MessageCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AppNotification, NotificationType } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/mock-data";

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  NEW_BID: {
    icon: <Package size={16} />,
    color: "bg-primary-50 text-primary-600",
  },
  BID_ACCEPTED: {
    icon: <CheckCheck size={16} />,
    color: "bg-secondary-50 text-secondary-600",
  },
  PAYMENT_ESCROWED: {
    icon: <DollarSign size={16} />,
    color: "bg-green-50 text-green-700",
  },
  DELIVERY_UPDATE: {
    icon: <Truck size={16} />,
    color: "bg-blue-50 text-blue-600",
  },
  NEW_MESSAGE: {
    icon: <MessageCircle size={16} />,
    color: "bg-purple-50 text-purple-600",
  },
  SYSTEM: {
    icon: <ShieldCheck size={16} />,
    color: "bg-gray-50 text-gray-500",
  },
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({ notification: n, onRead, onDismiss, onClose }: NotificationItemProps) {
  const cfg = typeConfig[n.type];
  const router = useRouter();

  const handleClick = () => {
    onRead(n.id);
    if (n.href) {
      onClose();
      router.push(n.href);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
        !n.read ? "bg-primary-50/40" : ""
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        {n.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          cfg.icon
        )}
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-charcoal" : "font-medium text-charcoal/80"}`}>
            {n.title}
          </p>
        </div>
        <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
        <p className="text-xs text-muted/70 mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {!n.read && (
        <div className="absolute right-10 top-4 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        className="absolute right-3 top-3.5 text-muted hover:text-charcoal transition-colors"
      >
        <X size={14} />
      </motion.button>
    </motion.div>
  );
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export default function NotificationDrawer({
  open, onClose, notifications, unreadCount, onRead, onMarkAllRead, onDismiss,
}: NotificationDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-charcoal" />
                <h2 className="font-bold text-charcoal text-lg">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={onMarkAllRead}
                    className="text-xs text-primary font-semibold flex items-center gap-1"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                  <X size={20} className="text-muted" />
                </motion.button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted py-16">
                  <BellOff size={40} strokeWidth={1.5} />
                  <p className="font-semibold text-charcoal">You&apos;re all caught up</p>
                  <p className="text-sm text-center max-w-[200px]">No notifications right now.</p>
                </div>
              ) : (
                <motion.ul layout className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {notifications.map((n) => (
                      <NotificationItem key={n.id} notification={n} onRead={onRead} onDismiss={onDismiss} onClose={onClose} />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <p className="text-center text-xs text-muted">Pull down in the app to refresh</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
