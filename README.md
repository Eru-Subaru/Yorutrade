# ヨルトレード / YoruTrade

A Japanese fan-to-fan exchange board. Next.js serves the website; a Cloudflare Worker stores real listings, match requests and private chat in D1, with item photos in a private R2 bucket. The website never seeds sample listings or automatically invents a match.

## Local development

Use Node.js 22 or newer. From the repository root:

```sh
npm ci
npm --workspace=api run db:local
npm run dev
```

Open http://localhost:3000. The Worker runs on http://127.0.0.1:8787. Local development uses local D1/R2 storage, never a remote production database. No Cloudflare account is required for local testing. Copy `apps/web/.env.example` to `apps/web/.env.local` if overriding defaults.

## How real matching works

1. Register the item you have, the item you want, and the event where you can exchange it.
2. Another person registers the reciprocal offer at the same event. Item/event comparison ignores case, surrounding whitespace and Unicode width differences; use the same item names.
3. Propose the exchange using your own listing. The server rejects self-matches, incompatible offers, duplicates and already reserved items.
4. The other person explicitly accepts. Both listings are reserved together; competing pending proposals close.
5. Only those two browser sessions can read or send messages in the accepted exchange.

Users have a server-issued, anonymous browser session. A display name is not a verified identity. Clearing cookies or changing devices loses access; there is no account recovery or device sync. Do not clear cookies during an exchange. This model does not stop someone using multiple browsers. Add recoverable verified accounts before relying on stronger identity guarantees.

## Connect Cloudflare and Vercel

The repository contains the integration; deploying needs your authenticated Cloudflare and Vercel accounts. Never paste service tokens into chat or commit credentials.

1. Authenticate the Cloudflare CLI: `npx wrangler login` from `apps/api`.
2. Create the database and bucket:

   ```sh
   npx wrangler d1 create yorutrade
   npx wrangler r2 bucket create yorutrade-images
   ```

3. Put the returned D1 database ID in `apps/api/wrangler.jsonc`. Keep both **r2.dev** and R2 public custom-domain access disabled. The Worker reads photos through its R2 binding; no S3 keys are needed.
4. Set `ALLOWED_ORIGINS` in that file to the exact website origin (initially `https://yorutrade-web.vercel.app`). Keep `LOCAL_DEV` disabled in production.
5. Generate a random secret containing at least 32 characters and store the same value in the Worker and Vercel:

   ```sh
   npx wrangler secret put API_PROXY_SECRET
   npm run db:remote
   npm run deploy
   ```

6. In the Vercel project, set server-side environment variables:

   | Variable | Value |
   | --- | --- |
   | `APP_ORIGIN` | `https://yorutrade-web.vercel.app` (or your exact custom-domain origin) |
   | `CLOUDFLARE_API_URL` | The HTTPS root URL returned by Worker deployment |
   | `API_PROXY_SECRET` | The same secret stored in the Worker |

   None of these values should use a `NEXT_PUBLIC_` prefix. Redeploy the website after setting them. Vercel project root is `apps/web`; install dependencies using the monorepo lockfile.

7. Verify in two independent browser profiles: create reciprocal listings, propose, accept from the other profile, and send messages both ways. A third profile must be unable to read the conversation or send messages. Verify a real photo loads and non-image/oversized uploads fail. An empty database must show an empty state.

The Next.js API route forwards only the session cookie and trusted headers to a fixed Worker URL. This keeps browser cookies on the website origin and removes any need for public storage credentials or cross-domain cookie workarounds. On Vercel, rate limiting uses the platform's trusted `x-vercel-forwarded-for` header. Other hosts need an explicitly trusted IP integration before public use.

## Verification and security

```sh
npm run verify
npm audit --audit-level=high
```

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for the review scope and remaining deployment/operational requirements. Private chat persists in D1; refresh polling is used rather than WebSockets. Photos attached to active public listings are visible to board visitors. Client uploads are re-encoded to remove location metadata; direct API callers must remove metadata themselves.

Before a public launch, configure abuse controls, report/block/moderation and data deletion/retention processes appropriate to the service. The application does not verify people or item ownership and does not encrypt messages end to end. Configure provider billing limits and monitor usage.
