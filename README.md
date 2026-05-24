# KinSous2 (KinSous · FolkProvidr)

KinSous2 is a **Next.js 15 full-stack marketplace prototype** for connecting food seekers with verified culinary helpers across diaspora and local communities. It includes bounties, helper discovery, messaging, notifications, onboarding, tracking, and mock/real API pathways.

## Project Status

- **Current maturity:** Functional prototype with many production-minded flows already scaffolded.
- **Architecture:** App Router + API routes, typed domain models, reusable UI components, and lib-layer data mappers.
- **Primary gap to production:** Environment setup + dependency installation + hardening (auth, storage, observability, CI).

## Core Capabilities

- **Bounty Marketplace**
  - Create, browse, and manage bounties.
  - Bid and accept bid flows with API endpoints under `src/app/api/bounties/**`.
- **Helper Discovery & Profiles**
  - Helper list + profile pages with score/certification UI components.
- **Messaging System**
  - Conversation list, thread UI, streaming route stubs, typing indicators, uploads route, moderation routes.
- **Notifications & Presence**
  - Notification feed endpoints + subscription route + presence endpoint.
- **Payment & Escrow UX**
  - Payment page and escrow helper hooks for currency-based flow modeling.
- **Realtime/Tracking UX**
  - Tracking page/components and realtime utility scaffolding.
- **Authentication APIs**
  - Register/login/logout/me and profile/password/email/role update routes.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS, Framer Motion, Lucide icons
- **Data & Networking:** API Routes + React Query
- **Storage/Infra Libraries:** Neon serverless client, Vercel Blob, web-push

## Repository Layout

```text
src/
  app/                    # Pages and API routes (UI + backend handlers)
    api/
      auth/               # Auth endpoints
      bounties/           # Bounty CRUD + bidding endpoints
      helpers/            # Helper listing endpoint
      messages/           # Conversations/messages/uploads/stream/moderation
      notifications/      # Notifications + subscribe + item actions
      presence/           # Presence endpoint
  components/
    feed/                 # Bounty feed, cards, bid/review modals
    messages/             # Conversation list + thread shell
    payment/              # Payment status/shield UI
    profile/              # Profile cards, helper pages, certification/score
    tracker/              # Tracking experience UI
    ui/                   # App shell/navigation/drawers/onboarding/settings
    video/                # Video shopping overlay
  hooks/                  # App hooks (notifications, conversations, escrow, etc.)
  lib/                    # Auth, db access, mappers, realtime, push helpers
  types/                  # Shared domain types
public/
  sw.js                   # Service worker
```

## Requirements

- Node.js 20+
- npm 10+
- Environment variables for production-like usage (see below)

## Environment Variables

Create a `.env.local` file for local development:

```bash
# Auth
AUTH_SECRET=replace_with_long_random_secret

# Database
DATABASE_URL=postgres://...

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Optional/feature-specific integrations
BLOB_READ_WRITE_TOKEN=...
```

## Local Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Quality Checks

```bash
npm run lint
npm run build
```

> Note: Build/lint require full dependency installation and proper registry/network access.

## Professional Improvement Plan (Recommended)

1. **Dependency reliability**
   - Add lockfile governance and CI cache strategy.
   - Enforce deterministic installs (`npm ci`) in CI.
2. **Static quality gates**
   - Run ESLint + TypeScript checks on pull requests.
   - Add pre-commit hooks (lint staged files).
3. **Testing coverage**
   - Add unit tests for `lib/auth`, `lib/mappers`, `lib/db` query adapters.
   - Add integration tests for critical API routes (`auth`, `bounties`, `messages`).
4. **Security hardening**
   - Introduce rate limiting on auth/messaging endpoints.
   - Add validation middleware (Zod schema parsing per route).
   - Add audit logging for admin/security-sensitive actions.
5. **Observability**
   - Structured logging and request correlation IDs.
   - Error reporting pipeline (Sentry or equivalent).
6. **Operational readiness**
   - Add `CONTRIBUTING.md`, issue templates, CODEOWNERS, and CI badges.
   - Add deployment runbook and rollback instructions.

## Known Setup Pitfalls

- Missing or blocked npm registry access prevents installation of packages such as `@neondatabase/serverless`, `@vercel/blob`, and `web-push`.
- Without dependencies installed, `next build` and TypeScript checks will fail with module resolution errors.

## License

No license file is currently present. Add a `LICENSE` file before public distribution.
