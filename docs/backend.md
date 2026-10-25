# Cloudflare backend

Yorutrade's API runs on a Cloudflare Worker. D1 stores browser identities, listings, reciprocal match proposals, and messages. A private R2 bucket stores item photos. The Next.js application proxies `/api/*` on the website's origin; the browser never receives the Cloudflare proxy secret.

## Local development

From the repository root:

```text
npm ci
npm --workspace=api run db:local
npm run dev
```

The API listens on `http://127.0.0.1:8787`. `LOCAL_DEV=true` is passed only by the development command. This allows loopback development without the production proxy secret and without the Secure cookie flag. Do not set `LOCAL_DEV=true` in a deployed Worker.

## Cloudflare deployment

Authenticate Wrangler with the account that will own Yorutrade, create D1 and R2 resources, and replace the placeholder D1 ID in `apps/api/wrangler.jsonc`. Keep the R2 bucket private: do not enable `r2.dev` public access or a public bucket domain.

```text
npx wrangler login
npx wrangler d1 create yorutrade --cwd apps/api
npx wrangler r2 bucket create yorutrade-images --cwd apps/api
npm --workspace=api run db:remote
npx wrangler secret put API_PROXY_SECRET --cwd apps/api
npm --workspace=api run deploy
```

Use a randomly generated secret of at least 32 characters. Set the exact same value in the Next.js hosting environment as `API_PROXY_SECRET`; set `CLOUDFLARE_API_URL` to the deployed Worker's HTTPS origin and `APP_ORIGIN` to the site's exact HTTPS origin. These variables must remain server-only and must never have a `NEXT_PUBLIC_` prefix. Set the Worker's `ALLOWED_ORIGINS` to that same website origin. Additional explicitly approved origins can be comma-separated. Production requests fail closed when the proxy secret is absent or shorter than 32 characters.

The production Worker checks the proxy secret on all endpoints and checks the exact Origin on mutations. The proxy is responsible for rejecting cross-site requests before replacing the Origin header, forwarding only the Yorutrade session cookie, and overwriting the trusted client-IP header. On Vercel it should use only Vercel's trusted forwarding header. If the platform does not provide a trustworthy client IP, the fallback rate limit is shared by requests from the proxy egress address; configure the host's IP handling before serving a larger audience.

Create and migrate the database before deployment. This migration intentionally has no sample listings, simulated users, seed matches, or fake messages. Deploy the Next.js frontend after its server environment variables are configured.

## Behavior and limits

- An anonymous identity belongs to one browser session. The opaque 256-bit cookie is HttpOnly, SameSite=Lax, Secure in production, and valid for 180 days; only its SHA-256 digest is stored. Clearing the cookie loses access to that identity. These are not verified accounts or proof that two sessions belong to different humans.
- Listings remain discoverable for 30 days. Title, offered item, wanted item, and event are required and at most 120 characters; notes are at most 1,000. The API returns the most recent 100 public active listings, with optional query/category filtering. `mine=1` retrieves the authenticated browser's active listings separately.
- A proposal requires two active, unexpired listings owned by different identities, with the same category and event and reciprocal offered/wanted items. Comparison uses Unicode NFKC normalization, whitespace normalization, and lowercasing. Exact item names and event names should be agreed by users; this is not semantic matching.
- Only the recipient can accept or decline a pending proposal. SQLite triggers reserve both listings atomically and decline competing proposals, including when acceptance requests arrive together. Acceptance also checks expiry. No generated match is returned merely because a form was submitted.
- Only the two participants in an accepted match can read or send its messages. Chat is durable D1 storage with frontend polling, not a WebSocket service. Messages contain at most 2,000 characters. Reads return the most recent 200 messages in chronological order.
- Photos accept only matching JPEG, PNG, or WebP content types and file signatures, with a hard 5 MiB API limit. Browser preparation may use a smaller upload cap for the frontend host. A photo must belong to the listing creator and may be attached once. No caller-supplied R2 keys are accepted. File signatures are not a full image decoder, content moderation, or malware scanning.
- An active, unexpired listing's photo is public through the authenticated server proxy. An unpublished, matched, withdrawn, or expired photo is accessible only by its owner or accepted match participants. R2 itself remains private. Responses use `nosniff`, bounded content types, and `private, no-store`.
- Durable D1 quotas apply to session creation (20/IP/hour), listings (10/identity/hour and 50/IP/hour), images (10/identity/hour and 40/IP/hour), proposals (30/identity/hour), decisions (60/identity/hour), profile changes (20/identity/hour), and chat sends (30/identity/minute). These basic controls do not replace bot protection or platform traffic limits.

The daily scheduled job removes expired sessions/rate windows and photo records that have remained unpublished for more than 24 hours. A database trigger queues R2 keys before deletion; failed object deletions can be retried on the next run. Published listings, accepted chats, user rows, and their photos have no automatic erasure policy yet. Listing expiry hides content; it does not erase stored data. Establish a retention/deletion and moderation process before a broad public launch.

## Validation

```text
npm --workspace=api run build
npm --workspace=api test
```

The tests use local Miniflare D1/R2 bindings. They validate ownership, hashes/cookies, cross-origin and proxy guards, reciprocal and self-match constraints, accepted chat authorization, simultaneous competing acceptance, expiry, upload limits/signatures, and durable quotas. They make no requests to production services.
