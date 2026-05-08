# KinSous · FolkProvidr

**Cultural Culinary Social Marketplace** — connecting Seekers with local culinary Helpers for authentic West African food experiences across Nigeria and the US diaspora.

---

## 🍽️ Features

| Feature | Description |
|---|---|
| **Bounty Board** | Seekers post food/ingredient requests; Helpers bid in real-time |
| **Post Bounty** | 3-step animated modal: details → location → budget with summary confirmation |
| **Browse Helpers** | Search + country-filter, helper cards with ChefScore, ratings, verified badge |
| **FaceTime Assist** | Live video-shopping overlay with draggable PiP, camera snapshots, and in-session chat |
| **Dual-Market Escrow** | Stripe (USD) and Flutterwave (NGN) — provider auto-selected by currency |
| **Live Tracker** | Animated Mapbox-ready map with pulsing helper marker + 3-stage delivery stepper |
| **Helper Profile** | ChefScore gauge, certification badges (ServSafe, HACCP, etc.), performance stats |
| **Notifications** | Bell icon with unread badge, slide-in drawer, per-notification dismiss & mark-read |
| **Settings** | Role switch (Seeker/Helper), currency, per-type notification toggles, dark mode |
| **Onboarding** | 4-slide animated intro with role-selection screen |

---

## 🛠 Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** (custom design tokens — cream, charcoal, primary orange, secondary green)
- **Framer Motion** (card animations, PiP drag, delivery stepper, chat slide-up)
- **Lucide React** (icons)
- **@tanstack/react-query** (ready for server data wiring)

---

## 📁 Project Structure

```
src/
├── app/                   # Next.js App Router pages (12 routes)
│   ├── page.tsx           # Home / landing
│   ├── bounties/          # Bounty Board feed + Post Bounty modal
│   ├── helpers/           # Browse & search Helpers
│   ├── video/             # FaceTime Assist demo
│   ├── tracker/           # Live delivery tracker
│   ├── profile/           # Helper profile
│   ├── payment/           # Escrow payment demo
│   ├── settings/          # App settings
│   └── onboarding/        # Intro slides + role selection
├── components/
│   ├── feed/              # BountyCard, BidSection, Feed, PostBountyModal
│   ├── video/             # VideoShoppingOverlay
│   ├── payment/           # PaymentShield badge
│   ├── tracker/           # Tracker + animated map
│   ├── profile/           # ProfileCard, ChefScore, CertificationBadge, HelpersPage
│   └── ui/                # BottomNav, TopBar, NotificationDrawer, Skeleton, Settings, Onboarding
├── hooks/
│   ├── usePaymentEscrow.ts  # Dual-market escrow hook
│   ├── useNotifications.ts  # Notification state + actions
│   └── useData.ts           # Mock React Query-style hooks (useBounties, useHelpers, usePlaceBid)
├── lib/
│   └── mock-data.ts         # Mock profiles, bounties, tracking data, utilities
└── types/
    └── index.ts             # All TypeScript interfaces
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run lint
```

---

## 🔌 Next Steps (Backend Integration)

- [ ] Prisma + PostgreSQL schema (Users, Bounties, Bids, Escrow, Messages)
- [ ] NextAuth.js for authentication (Google + phone OTP)
- [ ] Stripe Connect for US helper payouts
- [ ] Flutterwave v3 API for NGN transactions
- [ ] Mapbox GL JS real-time location with Pusher/Ably websockets
- [ ] Cloudinary for bounty image uploads
- [ ] Push notifications (Expo / Firebase for mobile PWA)
