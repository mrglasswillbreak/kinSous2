# KinSous

A Nigeria-first culinary marketplace built with Next.js, React and Neon Postgres.

The application supports account management, bounty posting and bidding, private conversations, order milestones, NGN checkout, payout/refund review and a mobile PWA. The warm orange interface includes light/dark/system themes, responsive navigation, accessible forms and explicit loading/error states.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Without DATABASE_URL, development uses a local demo database. POST /api/auth/seed creates the documented demo users; this endpoint is disabled in production. Hosted payments, email verification and private attachments require their corresponding services. Production requires a configured database and strong authentication secret.

## Hosted setup

Copy .env.local.example to .env.local and configure your own service values. Never commit secrets.

```sh
npm run db:migrate
npm run build
npm start
```

Schema migrations are explicit and versioned. They never run from user requests.

Read [the launch runbook](docs/LAUNCH.md) before configuring Vercel, Neon, Flutterwave, private Vercel Blob, Resend, web push and the reconciliation scheduler. Live collection and delayed helper payouts remain disabled until the provider has approved the business model. Commission is 10%; the platform covers processing charges. Refunds and disputed deliveries require operator review.

## PWA

The service worker supports installation, an offline fallback and controlled updates. It only caches approved public assets; private pages and APIs stay network-only. Unsent bounty/message text is saved on the device when storage is available. Drafts are scoped to the account and cleared on logout. Payments and submissions require an online connection and explicit user action.

Audio/video calls, live GPS and new USD orders are deferred. Existing USD records remain readable.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Database tests execute the migrations against PGlite and verify transactional order rules. Security tests cover payment verification, token integrity and public-data filtering. Browser tests exercise mobile/desktop navigation, theme persistence, draft recovery, offline launch and two-account marketplace messaging in local demo mode.

Provider-backed testing, real-device installation/push and staging deployment require configured accounts; local test success does not substitute for those checks.
