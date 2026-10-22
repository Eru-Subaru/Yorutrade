# Security review — 22 October 2026

## Scope and evidence

This review covers the Yorutrade source in this checkout, the dependency audit, and the new Cloudflare integration. It does not include an assessment of the user's Cloudflare/Vercel account settings, production data, or deployed service configuration. No live penetration testing was performed.

The baseline was commit `c8614a7`. Its API only exposed health checks; the homepage displayed hardcoded example listings and the registration page kept image previews in browser memory. Chat, real matching, and persisted uploads did not exist in that baseline. Those missing features are functional/integrity gaps, not evidence of an exploited authorization flaw.

The baseline dependency audit reported **23 advisories: 4 moderate, 15 high, 4 critical**. Counts describe package advisories, not confirmed exploitation. Next.js was upgraded from 16.3.2 to 16.4.2; unused Express and shadcn CLI dependencies were removed. The final audit result is recorded with the project verification below.

A limited scan of source files found no obvious private-key, AWS access-key, or GitHub-token patterns. This was not a full scan of Git history or every possible credential format.

## Fixes and controls checked in source

| Area | Result |
| --- | --- |
| Fake activity | Hardcoded listing data is removed. An empty database returns an empty board; no seed creates a user, match, or reply. |
| Request boundary | The Next.js proxy uses a fixed server-configured Worker origin, authenticates with a server secret, allowlists paths and forwarded headers, forwards only the session cookie, rejects redirects, and rejects foreign/missing origins on writes. Both proxy and Worker limit streamed request sizes. |
| Sessions | The server creates random 256-bit bearer tokens, stores only their SHA-256 hashes in D1, expires them after 180 days, and sets host-only HttpOnly/Secure/SameSite cookies in production. A client-supplied user ID cannot choose the acting user. |
| Data access | User input is bound to prepared SQL statements. Profile changes use the session owner. Match reads and chat reads/writes require a participant; chat opens only after recipient acceptance. Responses avoid storing session/chat content in shared caches. |
| Real matching | Creation checks different owners, reciprocal normalized item names, category, event, active status and 30-day listing age. A database trigger atomically reserves both listings and closes competing proposals. Review found and fixed an acceptance path that initially omitted the age check. |
| Photos | Only JPEG/PNG/WebP types with matching signatures are accepted. SVG/HTML uploads are rejected. Unpublished photos are owner-only; published photos are public only while the listing is active and unexpired. Owners and accepted participants retain access afterward. Responses use fixed raster types and `nosniff`. Signature checks do not fully decode or certify the image. |
| Upload cleanup | Review found and fixed an object-deletion race with publication and a partial-write orphan risk. Image metadata is registered before R2 upload. Scheduled cleanup atomically removes old unattached metadata, queues object keys and retries R2 deletion; failures do not require deleting live listing photos. |
| Basic abuse limits | Durable D1 counters bound session creation, listing creation, uploads, profile edits, proposals, acceptance and message sending. JSON fields and chat length are bounded. These controls do not stop distributed abuse. |
| Source/deployment hygiene | Tracked vendored dependency files were removed from Git tracking; generated output and local secrets are ignored. Deployment must use `src/worker.ts` and a clean locked install. |

Source review did not identify another actionable authorization or SQL-injection issue in the implemented routes. This is a scoped review, not a guarantee that the application has no vulnerabilities.

## Verification

Independent in-memory SQLite checks passed for atomic reservation of both listings, closing competing proposals, rejecting acceptance of expired listings, and queuing orphan objects for removal. The project also includes runtime Worker tests for separate sessions, forged identities, cross-origin/missing-secret rejection, participant-only chat, image ownership and upload limits, plus tests for the Next.js proxy boundary.

Final local verification on 22 October 2026: web lint passed, all **8 Cloudflare D1/R2 integration tests and 6 proxy security tests passed**, and the API typecheck and Next.js production build passed. The complete `npm audit --json` result reports **0 known vulnerabilities**, including development dependencies. The unpatched `braces` chain was removed by replacing the Next-specific lint preset with independent TypeScript, React Hooks and JSX accessibility checks; framework compilation remains covered by `next build`. No forced version overrides or framework downgrades were used.

A browser check through the running Next.js proxy and local Worker saved an actual listing, proposed a reciprocal exchange, accepted it from a separate local session, and sent/received private chat messages. These disposable fixtures were local only. No production records were modified. Account resources, secrets, bindings and production routes require separate configuration and production verification; source changes and local tests do not confirm deployment.

## Operational requirements

- Serve the website and Worker over HTTPS. Keep the Worker base URL, proxy secret, D1 binding, and R2 binding on the server. Never place an API secret in a `NEXT_PUBLIC_` variable or commit it.
- Use a private R2 bucket without public development or custom-domain access. Photos are served through application-controlled routes; active listing photos and listing text are intentionally visible to visitors. Both access methods can independently expose objects; see [Cloudflare's public bucket documentation](https://developers.cloudflare.com/r2/buckets/public-buckets/). Do not upload personal information. Normal browser uploads are re-encoded to remove location metadata; custom API clients can bypass that browser step.
- Anonymous browser sessions are bearer credentials. A stolen session can act as its owner. Clearing cookies, using another browser, or changing devices loses access unless account recovery is added; a new session does not prove a different human.
- Real matching means two compatible listings owned by different browser sessions, followed by the required explicit acceptance. It does not verify identity, possession of goods, or honesty. Never describe this as identity verification.
- D1-backed participant checks protect chat access; chat content is stored by the service and is not end-to-end encrypted. Avoid collecting addresses, payment information, phone numbers, or identity documents in chat.
- Application rate limits need Cloudflare edge controls against session creation and distributed abuse. Configure WAF/rate limits and monitoring for listing, upload, session, acceptance, and message traffic. Separate sessions or IPs can bypass per-session limits.
- Establish reporting/moderation, account/session revocation, listing removal, and an abuse contact before inviting broad public use. Add verified accounts or stronger anti-abuse controls if impersonation or repeat abuse occurs.
- Set and enforce a retention policy for expired sessions, stale listings, matches/messages, unused photos, and backups. Hiding or expiring a record is not the same as deleting its stored content. Monitor D1 and R2 usage and billing.
- Retain the dependency lockfile, review automated audit updates, and deploy from clean installs. Remove tracked dependency/build artifacts so deployment cannot accidentally run a stale API or vendored compiler.
- The CSP restricts scripts to this origin but permits inline scripts for Next.js hydration. It is defense in depth rather than a substitute for output escaping. A nonce-based policy can strengthen it when the hosting/rendering strategy supports that change.

## Production checks

Before a public release, verify two independent browser sessions can publish reciprocal listings, accept a match, exchange text, and see uploaded photos. Verify a third session cannot read messages or act on either user's listings or match. Verify mismatched/self/expired listings cannot create a chat, cross-origin writes are refused, and oversized/unsupported uploads are rejected. Confirm private photos do not bypass application policy through a public bucket URL.

Prepared SQL parameters follow [Cloudflare D1's recommended binding API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/). Keep these ownership and participant checks in the server when adding routes; browser-side checks alone are insufficient.
