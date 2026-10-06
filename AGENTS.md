# Project rules

- Business data lives in Turso, accessed only through the `turso-api` backend function via `src/lib/db.ts` — Turso credentials must never reach the browser.
- Admin sign-in and admin roles stay on Lovable Cloud auth; `turso-api` verifies the caller's token and admin role before any write — Turso has no auth.
- Turso schema lives in `turso/setup.sql`; new tables/columns must also be whitelisted in `turso-api` — the function rejects unknown tables and columns.
- AI features run in their own backend functions (e.g. ride-advisor) that read the catalog from Turso server-side — keeps the AI key and Turso credentials off the browser.
