# Yorutrade website

The Next.js frontend uses Japanese system fonts and the same-origin `/api/*` proxy to the Cloudflare Worker. See the [project README](../../README.md) for development, deployment, matching behavior and verification, and the [security review](../../SECURITY_REVIEW.md) for the review scope and deployment requirements.

Configure server-only `APP_ORIGIN`, `CLOUDFLARE_API_URL` and `API_PROXY_SECRET` in the hosting project. An example is provided in `.env.example`; never commit actual secrets or prefix the proxy secret with `NEXT_PUBLIC_`.
