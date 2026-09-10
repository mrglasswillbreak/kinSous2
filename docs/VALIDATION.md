# Validation record — 10 September 2026

## Completed locally

- ESLint and TypeScript validation.
- Next.js production build without configured external services; runtime health correctly requires production configuration.
- Four automated database/security tests using PGlite, covering migrations, concurrent bid acceptance, payment amount/reference validation, order ownership and stages, dispute resolution, single payout creation, single-use recovery tokens, revoked sessions and public DTO privacy.
- Bounty-scoped conversation migration tested separately from direct conversations.
- Four Playwright cases across mobile and desktop Chromium: two-account posting/bidding/acceptance/messaging, duplicate-message retries, private endpoint denial, NGN-only new orders, navigation, theme persistence, bounty draft restoration and offline navigation/reconnection.
- Production dependency audit: zero known vulnerabilities at the time of this check.

## Required before launch

- Run migrations and integration tests against an isolated Neon/Postgres database. Local browser tests use a demo store, not Neon.
- Complete Flutterwave sandbox checkout, duplicate webhook, payout/refund retry, uncertain outcome, abandoned checkout and outage scenarios. Obtain provider approval before delayed live payouts.
- Verify Resend delivery, private Blob access, production session expiry/revocation, account switching and push detachment in staging.
- Test Android Chrome, iOS Home Screen and desktop installation, permission handling, push deep links, update acceptance with drafts, checkout update deferral and logout cleanup on real devices.
- Manually check mobile keyboards, landscape safe areas, 200% zoom, keyboard navigation, screen-reader announcements and slow connections across supported browsers.
- Configure error monitoring, cron reconciliation and the named admin operator. Publish approved payment/refund/privacy policies.
- Deploy to staging with separate credentials and complete the runbook before production.

No cloud deployment, live payment, provider sandbox transaction or real-device push test was performed in this workspace. See [the launch runbook](LAUNCH.md) for configuration and rollout steps.
