# KinSous · FolkProvidr

**Cultural Culinary Social Marketplace** — connecting Seekers with local culinary Helpers for authentic West African food experiences across Nigeria and the US diaspora.

---

## 🍽️ Features

| Feature | Description |
|---|---|
| **Bounty Board** | Seekers post food/ingredient requests; Helpers bid in real-time |
| **FaceTime Assist** | Live video-shopping overlay with draggable PiP, camera snapshots, and in-session chat |
| **Dual-Market Escrow** | Stripe (USD) and Flutterwave (NGN) — provider auto-selected by currency |
| **Live Tracker** | Animated Mapbox-ready map with pulsing helper marker + 3-stage delivery stepper |
| **Helper Profile** | ChefScore gauge, certification badges (ServSafe, HACCP, etc.), performance stats |

---

## 🛠 Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (custom design tokens — cream, charcoal, primary orange, secondary green)
- **Framer Motion** (card animations, PiP drag, delivery stepper, chat slide-up)
- **Lucide React** (icons)
- **@tanstack/react-query** (ready for server data wiring)

---

## 📁 Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Home / landing
│   ├── bounties/          # Bounty Board feed
│   ├── video/             # FaceTime Assist demo
│   ├── tracker/           # Live delivery tracker
│   ├── profile/           # Helper profile
│   └── payment/           # Escrow payment demo
├── components/
│   ├── feed/              # BountyCard, BidSection, Feed
│   ├── video/             # VideoShoppingOverlay
│   ├── payment/           # PaymentShield badge
│   ├── tracker/           # Tracker + animated map
│   ├── profile/           # ProfileCard, ChefScore, CertificationBadge
│   └── ui/                # BottomNav
├── hooks/
│   └── usePaymentEscrow.ts  # Dual-market escrow hook
├── lib/
│   └── mock-data.ts         # Mock profiles, bounties, tracking data
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