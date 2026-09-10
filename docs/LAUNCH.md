# KinSous launch runbook

## Environments

Use separate Vercel projects, Neon databases, private Blob stores, Flutterwave credentials and email sender domains for staging and production. The application never falls back to a local database in production. Local development without DATABASE_URL uses explicit demo data; online payments and private uploads require hosted services.

Required: DATABASE_URL, AUTH_SECRET (at least 32 random characters), NEXT_PUBLIC_SITE_URL. Optional features need BLOB_READ_WRITE_TOKEN (private store), RESEND_API_KEY, EMAIL_FROM, FLW_SECRET_KEY, FLW_SECRET_HASH, PAYMENTS_ENABLED, VAPID_PUBLIC_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT. The two public VAPID keys must match. Set ADMIN_USER_IDS to a comma-separated list of verified operator user IDs; users cannot grant themselves access. Set CRON_SECRET for the reconciliation endpoint.

Configure Flutterwave v3 webhooks at `/api/payments/webhook` using the matching secret hash. Configure merchant fee settings so the platform absorbs processing fees. Set PAYMENTS_ENABLED=true for sandbox testing. Live keys additionally require FLW_DELAYED_PAYOUT_APPROVED=true, only after provider approval for this business model. This application does not provide regulated escrow.

## Database and deployment

1. Back up the database and confirm the restore procedure on a separate branch.
2. Run `npm ci`, `npm run lint`, `npm test` and `npm run build`.
3. Set staging DATABASE_URL and run `npm run db:migrate`. Migrations preserve existing records. Existing conflicting accepted bids cause the unique-index migration to fail rather than silently changing awards: resolve those records with the business owner first.
4. Existing active bounties predating the order model need manual reconciliation; do not automatically collect payment or trigger payouts for them. Create no fabricated payment history. The admin review table includes these legacy records.
5. Deploy to staging. Check `/api/health`, then test two accounts through bidding, checkout, delivery, confirmation and settlement. Test denied access, refunds, disputes and webhook retries using Flutterwave sandbox.
6. Verify Resend verification/reset email delivery and private Blob uploads. Complete Android and iOS Home Screen installation/push tests with real devices. Test updates while drafts are open and checkout is in progress.
7. Publish approved privacy, payment, delivery and refund policies and name the on-duty operator. Repeat migrations and deploy production only after the staging checks and provider onboarding pass.

Vercel cron frequency requires a plan supporting five-minute jobs; otherwise configure an authenticated external scheduler. `/api/jobs/reconcile` reconciles payment attempts and transfers. Failed/ambiguous transfer submissions become REVIEW_REQUIRED and are never automatically submitted a second time. Investigate them in the provider dashboard before any further financial action. An uncertain checkout with no link also needs operator reconciliation; do not discard its reference while it could still settle.

## Monitoring and rollback

Monitor HTTP 5xx, health checks, webhook failures, old pending payments, transfer REVIEW_REQUIRED records and open disputes. HTTP 207 from reconciliation means some items need investigation. The admin screen is `/admin`; every financial resolution records a reason. Do not put card details, passwords, tokens or full webhook payloads in logs.

Rollback application code through Vercel to the previous verified release. Keep additive database migrations and payment records intact; never roll back financial records to a snapshot after live traffic. Disable PAYMENTS_ENABLED to stop new payment provider operations while investigating. Resume reconciliation only after checking uncertain provider outcomes.

## PWA privacy and release behavior

The worker caches only the offline page and selected public icons. It never caches authenticated navigation or APIs. Drafts are account-scoped text in IndexedDB, cleared on logout; attachments are not retained. Browser storage can be unavailable or evicted, so offline drafts are best-effort. New builds hash application/public sources into the worker cache version. Users accept reloads explicitly, and updates are deferred on payment pages or during busy forms.

## Validation boundaries

Automated database tests use PGlite (Postgres in-process), not an actual Neon deployment. Browser tests use a separate local demo database. Flutterwave sandbox/live calls, Resend delivery, Vercel deployment, private Blob access and real-device push must be checked with configured accounts. Passing automated tests does not certify these external integrations.
